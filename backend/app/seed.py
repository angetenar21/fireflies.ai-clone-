"""Seed SQLite with 6 realistic sample meetings.

Idempotent: safe to run multiple times (wipes existing rows first).

Usage (from backend/):
    python -m app.seed
"""

from __future__ import annotations

from datetime import datetime, timedelta, timezone
from typing import Iterable, TypeVar

from sqlalchemy import text

from app.db.session import SessionLocal, engine, Base, DATABASE_URL
from app.auth_utils import DEMO_EMAIL, DEMO_NAME, DEMO_PASSWORD, ensure_demo_user
from app.models import (
    ActionItem,
    AuthSession,
    KeyTopic,
    Meeting,
    Participant,
    Speaker,
    Summary,
    Tag,
    TranscriptLine,
    User,
    meeting_participants,
    meeting_tags,
)

T = TypeVar("T")

SPEAKER_COLORS = ["#F97316", "#3B82F6", "#10B981", "#8B5CF6", "#EF4444", "#06B6D4"]


def _dedupe(items: Iterable[T]) -> list[T]:
    """Preserve order while dropping duplicate object identities."""
    seen: set[int] = set()
    out: list[T] = []
    for item in items:
        key = id(item)
        if key in seen:
            continue
        seen.add(key)
        out.append(item)
    return out


def _lines(
    meeting: Meeting,
    speakers: dict[str, Speaker],
    rows: list[tuple[str, float, float, str]],
) -> list[TranscriptLine]:
    """rows: (speaker_name, start_s, end_s, text)"""
    out: list[TranscriptLine] = []
    for i, (name, start, end, text_body) in enumerate(rows):
        out.append(
            TranscriptLine(
                meeting=meeting,
                speaker=speakers[name],
                start_time_seconds=start,
                end_time_seconds=end,
                text=text_body,
                order_index=i,
            )
        )
    return out


def clear_db(db) -> None:
    """Remove all seeded rows, including M2M association tables.

    Association tables are deleted explicitly — ORM meeting deletes alone can
    leave orphan meeting_participants rows on SQLite, which then collide on re-seed.
    """
    # Ensure FK cascades are honored for any remaining ORM deletes
    db.execute(text("PRAGMA foreign_keys=ON"))

    db.execute(meeting_participants.delete())
    db.execute(meeting_tags.delete())
    db.query(TranscriptLine).delete()
    db.query(ActionItem).delete()
    db.query(KeyTopic).delete()
    db.query(Summary).delete()
    db.query(Speaker).delete()
    db.query(Meeting).delete()
    db.query(AuthSession).delete()
    # Keep non-demo users; meetings wipe is enough for reseed
    db.query(Participant).delete()
    db.query(Tag).delete()
    db.commit()


def seed() -> None:
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    try:
        clear_db(db)
        demo_user = ensure_demo_user(db)
        db.flush()

        # --- Shared people ---
        people = {
            "maya": Participant(name="Manish Yadav", email="manish.yadav@quantumcorp.io"),
            "jordan": Participant(name="Rajesh Patel", email="michael.chang@quantumcorp.io"),
            "sam": Participant(name="Amit Singh", email="david.kim@quantumcorp.io"),
            "priya": Participant(name="Neha Sharma", email="elena.rostova@quantumcorp.io"),
            "alex": Participant(name="Vikram Gupta", email="james.smith@quantumcorp.io"),
            "chris": Participant(name="Rahul Verma", email="robert.chen@quantumcorp.io"),
            "lena": Participant(name="Priya Desai", email="jessica@horizontech.co"),
            "tom": Participant(name="Arjun Reddy", email="william.brooks@horizontech.co"),
            "nina": Participant(name="Kavita Rao", email="amanda.white@quantumcorp.io"),
            "demo": Participant(name=DEMO_NAME, email=DEMO_EMAIL),
        }
        for p in people.values():
            db.add(p)
        db.flush()

        tags = {
            "standup": Tag(name="standup"),
            "client": Tag(name="client"),
            "1:1": Tag(name="1:1"),
            "planning": Tag(name="planning"),
            "sales": Tag(name="sales"),
            "design": Tag(name="design"),
            "engineering": Tag(name="engineering"),
        }
        for t in tags.values():
            db.add(t)
        db.flush()

        now = datetime.now(timezone.utc).replace(tzinfo=None)

        # ========== 1. Engineering standup ==========
        m1 = Meeting(
            title="Engineering Standup — Platform Team",
            date=now - timedelta(days=1, hours=2),
            duration_minutes=18,
            is_starred=True,
            created_at=now - timedelta(days=1),
            updated_at=now - timedelta(days=1),
        )
        m1.participants = _dedupe(
            [people["maya"], people["jordan"], people["sam"], people["priya"]]
        )
        m1.tags = _dedupe([tags["standup"], tags["engineering"]])
        db.add(m1)
        db.flush()

        s1 = {
            "Manish Yadav": Speaker(meeting_id=m1.id, name="Manish Yadav", color=SPEAKER_COLORS[0]),
            "Rajesh Patel": Speaker(meeting_id=m1.id, name="Rajesh Patel", color=SPEAKER_COLORS[1]),
            "Amit Singh": Speaker(meeting_id=m1.id, name="Amit Singh", color=SPEAKER_COLORS[2]),
            "Neha Sharma": Speaker(meeting_id=m1.id, name="Neha Sharma", color=SPEAKER_COLORS[3]),
        }
        for sp in s1.values():
            db.add(sp)
        db.flush()

        m1.transcript_lines = _lines(
            m1,
            s1,
            [
                ("Manish Yadav", 0, 8, "Morning everyone. Let's keep this tight — blockers first, then updates."),
                ("Rajesh Patel", 8, 22, "I'm finishing the webhook retry queue. Tests are green locally; waiting on staging deploy."),
                ("Amit Singh", 22, 38, "I hit a flake in the CI pipeline for the transcript parser. Looking like a race in the fixture teardown."),
                ("Neha Sharma", 38, 52, "Design tokens PR is ready for review. Also synced with product on the empty-state copy."),
                ("Manish Yadav", 52, 65, "Michael, can you pair with David after this if the flake blocks the release branch?"),
                ("Rajesh Patel", 65, 78, "Yeah, I can jump on that around 11. David, drop the failing job link in Slack."),
                ("Amit Singh", 78, 95, "Will do. Separately — the search index rebuild took 14 minutes last night. We should chunk it."),
                ("Neha Sharma", 95, 110, "On the UI side, the meetings list filter by participant is done. Still need date-range."),
                ("Manish Yadav", 110, 128, "Prioritize date-range today. Client demo is Thursday and they'll want to find last week's calls."),
                ("Rajesh Patel", 128, 145, "Quick heads-up: Redis memory on staging is at 78%. I'll bump the eviction policy after standup."),
                ("Amit Singh", 145, 162, "Also merged the Alembic migration for action_items.is_completed. No downtime needed."),
                ("Neha Sharma", 162, 178, "One more — accessibility pass on the seek bar. Keyboard focus was skipping the transcript panel."),
                ("Manish Yadav", 178, 195, "Nice. Any other blockers?"),
                ("Rajesh Patel", 195, 208, "Need a decision on whether we keep VTT upload or only JSON for transcripts."),
                ("Manish Yadav", 208, 230, "Support both for now. JSON is canonical; VTT converts on ingest. I'll note it in the RFC."),
                ("Amit Singh", 230, 248, "Cool. I'll add a converter stub this afternoon so we're not blocked."),
                ("Neha Sharma", 248, 265, "I'll ship date-range filter and then help with empty states if there's time."),
                ("Manish Yadav", 265, 285, "Perfect. Retro is Friday at 3. Please add topics to the doc before then. Thanks all."),
                ("Rajesh Patel", 285, 295, "Sounds good. Catch you later."),
                ("Amit Singh", 295, 305, "Later."),
                ("Neha Sharma", 305, 312, "Bye!"),
                ("Manish Yadav", 312, 320, "Standup done — back to it."),
            ],
        )
        m1.summary = Summary(
            meeting_id=m1.id,
            overview_text=(
                "The platform team reviewed progress on webhook retries, CI flakiness in the transcript "
                "parser, and UI filters for the meetings library. Manish asked Michael to help David unblock "
                "the release branch and prioritized the date-range filter ahead of Thursday's client demo. "
                "The team agreed to accept both VTT and JSON transcript uploads, with JSON as the "
                "canonical format. Redis memory on staging and an accessibility fix for the seek bar were "
                "also called out."
            ),
            generated_at=now - timedelta(days=1),
        )
        m1.key_topics = [
            KeyTopic(meeting_id=m1.id, topic_text="Webhook retry queue & staging deploy", order_index=0),
            KeyTopic(meeting_id=m1.id, topic_text="CI flake in transcript parser", order_index=1),
            KeyTopic(meeting_id=m1.id, topic_text="Meetings list date-range filter", order_index=2),
            KeyTopic(meeting_id=m1.id, topic_text="Transcript upload formats (VTT vs JSON)", order_index=3),
            KeyTopic(meeting_id=m1.id, topic_text="Staging Redis memory & a11y seek bar", order_index=4),
        ]
        m1.action_items = [
            ActionItem(meeting_id=m1.id, text="Pair on CI flake blocking release branch", assignee="Rajesh Patel", is_completed=False, priority="high"),
            ActionItem(meeting_id=m1.id, text="Ship date-range filter on meetings list", assignee="Neha Sharma", is_completed=False, priority="high"),
            ActionItem(meeting_id=m1.id, text="Bump Redis eviction policy on staging", assignee="Rajesh Patel", is_completed=True, priority="medium"),
            ActionItem(meeting_id=m1.id, text="Add VTT→JSON converter stub", assignee="Amit Singh", is_completed=False, priority="medium"),
            ActionItem(meeting_id=m1.id, text="Document dual-format transcript ingest in RFC", assignee="Manish Yadav", is_completed=False, priority="low"),
        ]

        # ========== 2. Client call ==========
        m2 = Meeting(
            title="HorizonTech QBR — Product Walkthrough",
            date=now - timedelta(days=3, hours=4),
            duration_minutes=42,
            is_starred=True,
            created_at=now - timedelta(days=3),
            updated_at=now - timedelta(days=3),
        )
        m2.participants = _dedupe(
            [people["alex"], people["priya"], people["lena"], people["tom"]]
        )
        m2.tags = _dedupe([tags["client"]])
        db.add(m2)
        db.flush()

        s2 = {
            "Vikram Gupta": Speaker(meeting_id=m2.id, name="Vikram Gupta", color=SPEAKER_COLORS[0]),
            "Neha Sharma": Speaker(meeting_id=m2.id, name="Neha Sharma", color=SPEAKER_COLORS[3]),
            "Priya Desai": Speaker(meeting_id=m2.id, name="Priya Desai", color=SPEAKER_COLORS[1]),
            "Arjun Reddy": Speaker(meeting_id=m2.id, name="Arjun Reddy", color=SPEAKER_COLORS[2]),
        }
        for sp in s2.values():
            db.add(sp)
        db.flush()

        m2.transcript_lines = _lines(
            m2,
            s2,
            [
                ("Vikram Gupta", 0, 15, "Thanks for joining, Jessica and William. We'll walk through the new summary workspace and then open it up for questions."),
                ("Priya Desai", 15, 28, "Appreciate it. Our CS team has been asking for clearer action-item ownership, so that's top of mind."),
                ("Neha Sharma", 28, 48, "I'll share my screen. Here's the meetings library — search by title, participant, or date. Cards show duration and attendees."),
                ("Arjun Reddy", 48, 62, "Can we filter by account or tag? We have dozens of calls a week across regions."),
                ("Neha Sharma", 62, 80, "Tags are supported today. Account-level filtering is on the roadmap for next sprint — we can prioritize if it's a blocker."),
                ("Vikram Gupta", 80, 98, "We'll note that as a must-have for your rollout. Elena, show the detail view next."),
                ("Neha Sharma", 98, 125, "On the right: AI summary, key topics, and action items. On the left: interactive transcript. Click a line and the player seeks to that timestamp."),
                ("Priya Desai", 125, 145, "Love the sync. One ask — can assignees map to our Slack handles, not just free text?"),
                ("Vikram Gupta", 145, 165, "Not in this release, but we can export action items to CSV and you're already piping that into Asana."),
                ("Arjun Reddy", 165, 185, "That works short-term. Also, how accurate are the summaries on noisy sales calls?"),
                ("Vikram Gupta", 185, 210, "On seeded and uploaded transcripts we're seeing strong structure. Live STT is out of scope for this phase; quality depends on the source transcript."),
                ("Priya Desai", 210, 230, "Understood. For pilot we'd upload Zoom VTT files from our AE team."),
                ("Neha Sharma", 230, 250, "Perfect — VTT ingest is supported. I'll send a short guide after this call."),
                ("Arjun Reddy", 250, 275, "Security question: where does audio live? We can't store customer recordings outside our VPC indefinitely."),
                ("Vikram Gupta", 275, 305, "Audio can be a placeholder or customer-hosted URL. We persist transcript text and metadata in your instance's database."),
                ("Priya Desai", 305, 325, "That helps. Let's pilot with five AE seats starting Monday. Can we get SSO later?"),
                ("Vikram Gupta", 325, 345, "SSO is planned for enterprise. For pilot we'll use invite links. I'll send a proposal by EOD tomorrow."),
                ("Neha Sharma", 345, 365, "I'll also schedule a 30-minute enablement for your CS leads next week."),
                ("Arjun Reddy", 365, 380, "Great. One more — export to PDF for QBRs?"),
                ("Neha Sharma", 380, 395, "Markdown and TXT export ship first; PDF is a bonus we're scoping now."),
                ("Priya Desai", 395, 410, "Markdown is fine for the pilot. Thanks for the walkthrough."),
                ("Vikram Gupta", 410, 425, "Thank you both. We'll follow up with the proposal, VTT guide, and enablement invite."),
                ("Arjun Reddy", 425, 435, "Sounds good. Talk soon."),
                ("Neha Sharma", 435, 445, "Bye everyone."),
                ("Priya Desai", 445, 452, "Bye!"),
            ],
        )
        m2.summary = Summary(
            meeting_id=m2.id,
            overview_text=(
                "James and Elena walked HorizonTech through the meetings library and interactive transcript "
                "detail view. Jessica emphasized action-item ownership for CS, while William requested "
                "account-level filtering and clarified security constraints around audio storage. "
                "The parties agreed to a five-seat AE pilot starting Monday using Zoom VTT uploads, "
                "with CSV export as a temporary bridge to Asana. James will send a commercial proposal "
                "and Elena will provide a VTT guide plus enablement for CS leads."
            ),
            generated_at=now - timedelta(days=3),
        )
        m2.key_topics = [
            KeyTopic(meeting_id=m2.id, topic_text="Meetings library & search/filter demo", order_index=0),
            KeyTopic(meeting_id=m2.id, topic_text="Transcript–player timestamp sync", order_index=1),
            KeyTopic(meeting_id=m2.id, topic_text="Action items & Asana/CSV workflow", order_index=2),
            KeyTopic(meeting_id=m2.id, topic_text="Audio storage & security constraints", order_index=3),
            KeyTopic(meeting_id=m2.id, topic_text="Pilot scope: 5 AE seats + VTT ingest", order_index=4),
        ]
        m2.action_items = [
            ActionItem(meeting_id=m2.id, text="Send commercial proposal for HorizonTech pilot", assignee="Vikram Gupta", is_completed=True, priority="low"),
            ActionItem(meeting_id=m2.id, text="Email VTT upload guide to Jessica and William", assignee="Neha Sharma", is_completed=False, priority="medium"),
            ActionItem(meeting_id=m2.id, text="Schedule CS enablement session", assignee="Neha Sharma", is_completed=False, priority="medium"),
            ActionItem(meeting_id=m2.id, text="Prioritize account-level filter for next sprint", assignee="Vikram Gupta", is_completed=False, priority="medium"),
            ActionItem(meeting_id=m2.id, text="Confirm five AE pilot seats for Monday kickoff", assignee="Priya Desai", is_completed=False, priority="medium"),
        ]

        # ========== 3. 1:1 ==========
        m3 = Meeting(
            title="1:1 — Manish Yadav & Amit Singh",
            date=now - timedelta(days=2, hours=1),
            duration_minutes=28,
            created_at=now - timedelta(days=2),
            updated_at=now - timedelta(days=2),
        )
        m3.participants = _dedupe([people["maya"], people["sam"]])
        m3.tags = _dedupe([tags["1:1"], tags["engineering"]])
        db.add(m3)
        db.flush()

        s3 = {
            "Manish Yadav": Speaker(meeting_id=m3.id, name="Manish Yadav", color=SPEAKER_COLORS[0]),
            "Amit Singh": Speaker(meeting_id=m3.id, name="Amit Singh", color=SPEAKER_COLORS[2]),
        }
        for sp in s3.values():
            db.add(sp)
        db.flush()

        m3.transcript_lines = _lines(
            m3,
            s3,
            [
                ("Manish Yadav", 0, 12, "Hey David — how are you feeling about the release pace this sprint?"),
                ("Amit Singh", 12, 30, "Honestly a bit stretched. The parser flake ate two days, and I'm also on-call this week."),
                ("Manish Yadav", 30, 48, "That's fair. Let's protect focus time. What can we drop or hand off?"),
                ("Amit Singh", 48, 70, "The analytics dashboard polish can wait. I'd rather finish the VTT converter and stabilize CI."),
                ("Manish Yadav", 70, 90, "Agreed. I'll move dashboard polish to next sprint and tell product. Anything else weighing on you?"),
                ("Amit Singh", 90, 115, "I'd like more ownership of the ingest pipeline long-term — design docs, not just tickets."),
                ("Manish Yadav", 115, 140, "I want that too. How about you draft an ingest architecture one-pager by Friday? I'll review with you Monday."),
                ("Amit Singh", 140, 155, "That sounds great. I'll keep it practical — failure modes and retry semantics."),
                ("Manish Yadav", 155, 175, "Perfect. On career growth — are you still interested in mentoring the intern next month?"),
                ("Amit Singh", 175, 195, "Yes, as long as on-call weeks aren't stacked. Two hours a week feels right."),
                ("Manish Yadav", 195, 215, "I'll schedule it that way. Also, your promotion packet — I need two peer notes. Michael already agreed."),
                ("Amit Singh", 215, 230, "I can ask Elena for the second. She's seen the search work."),
                ("Manish Yadav", 230, 250, "Good. Feedback from me: your incident write-ups are excellent. Keep that visibility."),
                ("Amit Singh", 250, 268, "Thanks. One ask — can we get a staging alert when CI flakes exceed three in a day?"),
                ("Manish Yadav", 268, 290, "Yes. I'll file it with platform ops. Anything else before we wrap?"),
                ("Amit Singh", 290, 310, "Just confirming PTO next Thursday for the visa appointment — half day."),
                ("Manish Yadav", 310, 325, "Blocked on the calendar. Michael covers on-call that afternoon."),
                ("Amit Singh", 325, 340, "Appreciate it. This 1:1 helped a lot."),
                ("Manish Yadav", 340, 355, "Glad to hear. Draft that one-pager and ping me if the flake comes back."),
                ("Amit Singh", 355, 365, "Will do. Talk soon."),
                ("Manish Yadav", 365, 372, "Take care."),
            ],
        )
        m3.summary = Summary(
            meeting_id=m3.id,
            overview_text=(
                "Manish and David discussed sprint load, with David stretched by CI flakiness and on-call. "
                "They agreed to defer analytics dashboard polish and focus David on the VTT converter and "
                "CI stability. David will draft an ingest architecture one-pager for career ownership, "
                "and Manish will coordinate mentoring and promotion peer notes. Operational follow-ups "
                "include a CI flake alert and half-day PTO coverage next Thursday."
            ),
            generated_at=now - timedelta(days=2),
        )
        m3.key_topics = [
            KeyTopic(meeting_id=m3.id, topic_text="Sprint load & focus protection", order_index=0),
            KeyTopic(meeting_id=m3.id, topic_text="Ingest pipeline ownership", order_index=1),
            KeyTopic(meeting_id=m3.id, topic_text="Mentoring & promotion packet", order_index=2),
            KeyTopic(meeting_id=m3.id, topic_text="CI flake alerting & PTO coverage", order_index=3),
        ]
        m3.action_items = [
            ActionItem(meeting_id=m3.id, text="Move analytics dashboard polish to next sprint", assignee="Manish Yadav", is_completed=True, priority="low"),
            ActionItem(meeting_id=m3.id, text="Draft ingest architecture one-pager", assignee="Amit Singh", is_completed=False, priority="medium"),
            ActionItem(meeting_id=m3.id, text="Ask Elena for promotion peer note", assignee="Amit Singh", is_completed=False, priority="medium"),
            ActionItem(meeting_id=m3.id, text="File CI flake threshold alert with platform ops", assignee="Manish Yadav", is_completed=False, priority="medium"),
            ActionItem(meeting_id=m3.id, text="Confirm Michael covers on-call Thursday afternoon", assignee="Manish Yadav", is_completed=True, priority="low"),
        ]

        # ========== 4. Sprint planning ==========
        m4 = Meeting(
            title="Sprint 24 Planning — Meetings Experience",
            date=now - timedelta(days=5),
            duration_minutes=55,
            created_at=now - timedelta(days=5),
            updated_at=now - timedelta(days=5),
        )
        m4.participants = _dedupe(
            [
                people["maya"],
                people["jordan"],
                people["sam"],
                people["priya"],
                people["nina"],
            ]
        )
        m4.tags = _dedupe([tags["planning"], tags["engineering"]])
        db.add(m4)
        db.flush()

        s4 = {
            "Manish Yadav": Speaker(meeting_id=m4.id, name="Manish Yadav", color=SPEAKER_COLORS[0]),
            "Rajesh Patel": Speaker(meeting_id=m4.id, name="Rajesh Patel", color=SPEAKER_COLORS[1]),
            "Amit Singh": Speaker(meeting_id=m4.id, name="Amit Singh", color=SPEAKER_COLORS[2]),
            "Neha Sharma": Speaker(meeting_id=m4.id, name="Neha Sharma", color=SPEAKER_COLORS[3]),
            "Kavita Rao": Speaker(meeting_id=m4.id, name="Kavita Rao", color=SPEAKER_COLORS[4]),
        }
        for sp in s4.values():
            db.add(sp)
        db.flush()

        m4.transcript_lines = _lines(
            m4,
            s4,
            [
                ("Kavita Rao", 0, 18, "Goal for Sprint 24: ship a believable AuraNotes-like detail page — transcript sync, summary panel, and CRUD for meetings."),
                ("Manish Yadav", 18, 35, "Capacity-wise we have about 28 eng points after on-call and the HorizonTech pilot support."),
                ("Rajesh Patel", 35, 55, "I'd put 8 points on media seek sync and in-transcript search. The player stub can use a sample MP3."),
                ("Neha Sharma", 55, 75, "UI for library + detail is 10 points if we reuse the design tokens. Modals for create/edit meeting included."),
                ("Amit Singh", 75, 95, "API and schema are mostly ready. Seed data, upload endpoint, and action-item PATCH — call it 6 points."),
                ("Kavita Rao", 95, 115, "Must-haves from the assignment: library search/filter/sort, interactive transcript, AI summary section, full CRUD."),
                ("Manish Yadav", 115, 135, "Bonus only if must-haves are green: global search, tags, ask-the-meeting chat, dark mode."),
                ("Rajesh Patel", 135, 155, "Risk: timestamp sync bugs on long transcripts. I'll add unit tests around seek mapping."),
                ("Neha Sharma", 155, 175, "I'll match AuraNotes layout — left nav, list, then split transcript/summary. Study their spacing tonight."),
                ("Amit Singh", 175, 195, "Do we need real auth? Assignment says default logged-in user is fine."),
                ("Kavita Rao", 195, 210, "Correct — mock user in the navbar. Settings can be Coming Soon."),
                ("Manish Yadav", 210, 230, "Definition of done: seeded DB, README with schema, deployed frontend and API, demo link."),
                ("Rajesh Patel", 230, 250, "I'll own player + transcript sync. David owns upload and seed. Elena owns library and detail chrome."),
                ("Neha Sharma", 250, 270, "Can product write the six sample meeting narratives so seed text isn't lorem?"),
                ("Kavita Rao", 270, 290, "Yes — I'll draft themes today: standups, client, 1:1, planning, sales, design critique."),
                ("Amit Singh", 290, 310, "I'll structure seed.py to accept those narratives as structured dicts."),
                ("Manish Yadav", 310, 330, "Any dependencies on design?"),
                ("Neha Sharma", 330, 350, "Need final orange accent and sidebar width. I'll lock tokens in Figma by tomorrow morning."),
                ("Rajesh Patel", 350, 370, "Also need a royalty-free sample audio under /public or backend static."),
                ("Kavita Rao", 370, 390, "I'll drop a link in the sprint channel. Questions on prioritization?"),
                ("Amit Singh", 390, 405, "If upload slips, seed alone still demos the product — upload is still must-have though."),
                ("Manish Yadav", 405, 425, "Upload stays in must-have. Cut dark mode first if we slip."),
                ("Kavita Rao", 425, 445, "Locked. I'll update Jira and send the sprint goal to #product. Thanks everyone."),
                ("Neha Sharma", 445, 455, "Thanks Amanda."),
                ("Rajesh Patel", 455, 462, "Let's ship it."),
            ],
        )
        m4.summary = Summary(
            meeting_id=m4.id,
            overview_text=(
                "Sprint 24 planning focused on delivering a AuraNotes-like meetings experience: library "
                "search/filter, interactive transcript with media seek sync, summary panel, and meeting "
                "CRUD. The team allocated roughly 28 engineering points across player sync, UI chrome, "
                "and API/seed/upload work. Bonus features such as dark mode are explicitly lower priority. "
                "Owners were assigned for player, upload/seed, and library/detail UI, with Amanda providing "
                "sample meeting narratives for realistic seed content."
            ),
            generated_at=now - timedelta(days=5),
        )
        m4.key_topics = [
            KeyTopic(meeting_id=m4.id, topic_text="Sprint goal & must-have scope", order_index=0),
            KeyTopic(meeting_id=m4.id, topic_text="Capacity & point allocation", order_index=1),
            KeyTopic(meeting_id=m4.id, topic_text="Transcript sync & search risks", order_index=2),
            KeyTopic(meeting_id=m4.id, topic_text="Seed narratives & upload endpoint", order_index=3),
            KeyTopic(meeting_id=m4.id, topic_text="Design tokens & sample audio", order_index=4),
        ]
        m4.action_items = [
            ActionItem(meeting_id=m4.id, text="Draft six sample meeting narratives for seed", assignee="Kavita Rao", is_completed=True, priority="low"),
            ActionItem(meeting_id=m4.id, text="Implement media seek ↔ transcript sync", assignee="Rajesh Patel", is_completed=False, priority="medium"),
            ActionItem(meeting_id=m4.id, text="Build library + detail UI chrome", assignee="Neha Sharma", is_completed=False, priority="medium"),
            ActionItem(meeting_id=m4.id, text="Finish seed.py and transcript upload API", assignee="Amit Singh", is_completed=False, priority="medium"),
            ActionItem(meeting_id=m4.id, text="Lock design tokens in Figma", assignee="Neha Sharma", is_completed=True, priority="low"),
            ActionItem(meeting_id=m4.id, text="Provide sample audio asset link", assignee="Kavita Rao", is_completed=False, priority="medium"),
        ]

        # ========== 5. Sales discovery ==========
        brightly_contact = Participant(name="Carlos Mendes", email="carlos.mendes@careplus.health")
        db.add(brightly_contact)
        db.flush()

        m5 = Meeting(
            title="Discovery Call — CarePlus",
            date=now - timedelta(days=4, hours=3),
            duration_minutes=35,
            created_at=now - timedelta(days=4),
            updated_at=now - timedelta(days=4),
        )
        m5.participants = _dedupe([people["alex"], people["chris"], brightly_contact])
        m5.tags = _dedupe([tags["sales"], tags["client"]])
        db.add(m5)
        db.flush()

        s5 = {
            "Rahul Verma": Speaker(meeting_id=m5.id, name="Rahul Verma", color=SPEAKER_COLORS[0]),
            "Vikram Gupta": Speaker(meeting_id=m5.id, name="Vikram Gupta", color=SPEAKER_COLORS[1]),
            "Carlos Mendes": Speaker(meeting_id=m5.id, name="Carlos Mendes", color=SPEAKER_COLORS[2]),
        }
        for sp in s5.values():
            db.add(sp)
        db.flush()

        m5.transcript_lines = _lines(
            m5,
            s5,
            [
                ("Rahul Verma", 0, 14, "Carlos, thanks for the time. We're curious how Brightly handles meeting notes across clinical ops today."),
                ("Carlos Mendes", 14, 35, "Mostly messy. Nurses dictate into EHR, managers paste Zoom chats into Notion, and action items get lost."),
                ("Vikram Gupta", 35, 55, "That's a common pattern. Our product centralizes transcript, summary, and tasks without replacing your EHR."),
                ("Carlos Mendes", 55, 75, "HIPAA is non-negotiable. Can you run in our Azure tenant with BAA?"),
                ("Rahul Verma", 75, 95, "Yes — enterprise deploy supports customer-managed cloud and we sign a BAA. James can speak to architecture."),
                ("Vikram Gupta", 95, 120, "Transcripts encrypt at rest. We don't train models on customer data. Audio can stay in your blob storage."),
                ("Carlos Mendes", 120, 145, "Good. We'd start with care-coordination huddles — fifteen minutes, three to six people, twice daily."),
                ("Rahul Verma", 145, 165, "Perfect fit for our library and summary views. Do you need EHR write-back for tasks?"),
                ("Carlos Mendes", 165, 185, "Phase one: no. Export to CSV into our tasking tool is enough. Phase two maybe Epic."),
                ("Vikram Gupta", 185, 205, "We can scope CSV and webhook events in phase one. Epic would be a later integration project."),
                ("Carlos Mendes", 205, 225, "Pricing — we have about 40 care managers. What's ballpark for annual?"),
                ("Rahul Verma", 225, 250, "For 40 seats on enterprise, typically mid five-figures annually depending on SSO and retention. I'll send a range."),
                ("Carlos Mendes", 250, 270, "Also need admin audit logs. Our compliance team will ask in security review."),
                ("Vikram Gupta", 270, 290, "Audit logs are on the enterprise checklist. I can share the security one-pager today."),
                ("Rahul Verma", 290, 310, "Next step: 45-minute technical deep dive with your IT, then a two-week pilot on huddles."),
                ("Carlos Mendes", 310, 330, "I can do next Wednesday 11am PT for the deep dive. Pilot after our board week — so early August."),
                ("Rahul Verma", 330, 350, "I'll send a calendar hold and the security pack. Anything else blocking evaluation?"),
                ("Carlos Mendes", 350, 370, "Just confirm data residency options — US-only is required."),
                ("Vikram Gupta", 370, 390, "US-only regions are supported. We'll state that in the BAA exhibit."),
                ("Carlos Mendes", 390, 405, "Great conversation. Looking forward to the deep dive."),
                ("Rahul Verma", 405, 420, "Likewise — thanks Carlos. We'll follow up within a day."),
                ("Vikram Gupta", 420, 430, "Talk soon."),
                ("Carlos Mendes", 430, 438, "Bye."),
            ],
        )
        m5.summary = Summary(
            meeting_id=m5.id,
            overview_text=(
                "Robert and James ran a discovery call with Carlos Mendes at CarePlus about replacing "
                "fragmented Notion/EHR note-taking for care-coordination huddles. Carlos required HIPAA, "
                "customer-managed Azure, a BAA, US-only residency, and audit logs. Phase one would use CSV "
                "export rather than EHR write-back. Next steps are a technical deep dive next Wednesday "
                "and a two-week pilot targeted for early August, with Robert sending pricing ranges and "
                "James sharing the security one-pager."
            ),
            generated_at=now - timedelta(days=4),
        )
        m5.key_topics = [
            KeyTopic(meeting_id=m5.id, topic_text="Current note-taking pain points", order_index=0),
            KeyTopic(meeting_id=m5.id, topic_text="HIPAA, BAA & Azure tenancy", order_index=1),
            KeyTopic(meeting_id=m5.id, topic_text="Care-coordination huddle use case", order_index=2),
            KeyTopic(meeting_id=m5.id, topic_text="Pricing for ~40 seats", order_index=3),
            KeyTopic(meeting_id=m5.id, topic_text="Deep dive & August pilot plan", order_index=4),
        ]
        m5.action_items = [
            ActionItem(meeting_id=m5.id, text="Send enterprise pricing range for 40 seats", assignee="Rahul Verma", is_completed=False, priority="medium"),
            ActionItem(meeting_id=m5.id, text="Share security one-pager and audit-log details", assignee="Vikram Gupta", is_completed=True, priority="low"),
            ActionItem(meeting_id=m5.id, text="Send calendar hold for Wed 11am PT deep dive", assignee="Rahul Verma", is_completed=False, priority="medium"),
            ActionItem(meeting_id=m5.id, text="Confirm US-only residency language for BAA exhibit", assignee="Vikram Gupta", is_completed=False, priority="medium"),
        ]

        # ========== 6. Design critique ==========
        m6 = Meeting(
            title="Design Critique — Transcript Detail Layout",
            date=now - timedelta(hours=6),
            duration_minutes=40,
            created_at=now - timedelta(hours=6),
            updated_at=now - timedelta(hours=5),
        )
        m6.participants = _dedupe(
            [people["priya"], people["nina"], people["jordan"], people["maya"]]
        )
        m6.tags = _dedupe([tags["design"]])
        db.add(m6)
        db.flush()

        s6 = {
            "Neha Sharma": Speaker(meeting_id=m6.id, name="Neha Sharma", color=SPEAKER_COLORS[3]),
            "Kavita Rao": Speaker(meeting_id=m6.id, name="Kavita Rao", color=SPEAKER_COLORS[4]),
            "Rajesh Patel": Speaker(meeting_id=m6.id, name="Rajesh Patel", color=SPEAKER_COLORS[1]),
            "Manish Yadav": Speaker(meeting_id=m6.id, name="Manish Yadav", color=SPEAKER_COLORS[0]),
        }
        for sp in s6.values():
            db.add(sp)
        db.flush()

        m6.transcript_lines = _lines(
            m6,
            s6,
            [
                ("Neha Sharma", 0, 16, "Thanks for joining the critique. Goal: decide layout for transcript vs summary before I build."),
                ("Kavita Rao", 16, 35, "AuraNotes puts transcript dominant on the left and AI tabs on the right. We should mirror that familiarity."),
                ("Rajesh Patel", 35, 55, "From an eng view, sticky player at the top helps seek sync. Don't bury the scrubber in a side panel."),
                ("Manish Yadav", 55, 75, "Agree. Also keep speaker colors consistent between list avatars and transcript labels."),
                ("Neha Sharma", 75, 95, "Option A: 60/40 split. Option B: tabs that swap transcript and summary on smaller screens."),
                ("Kavita Rao", 95, 115, "Do both — 60/40 on desktop, tabs under 1024px. Assignment graders will resize."),
                ("Rajesh Patel", 115, 135, "Search-in-transcript should highlight matches and jump on Enter. I'll expose a callback from the player hook."),
                ("Neha Sharma", 135, 155, "For action items, checkboxes inline with assignee chips. Completed ones mute but stay visible."),
                ("Manish Yadav", 155, 175, "Empty states matter — new meeting with no summary should show a generate placeholder, not a blank card."),
                ("Kavita Rao", 175, 195, "Copy: 'Summary will appear here once generated.' Avoid generic 'No data'."),
                ("Neha Sharma", 195, 215, "Navbar: logo, Meetings, Upload, and a fake profile menu. Settings route can be Coming Soon."),
                ("Rajesh Patel", 215, 235, "One concern — long transcripts of 400 lines. Virtualize the list or we'll jank on scroll."),
                ("Neha Sharma", 235, 255, "I'll virtualize if we exceed 100 lines; seed data is under 40 so we can ship without it first."),
                ("Manish Yadav", 255, 275, "Fine for the assignment. Leave a TODO. Typography — not Inter. Something a bit warmer."),
                ("Kavita Rao", 275, 295, "Try Source Sans for UI and a slightly tighter mono for timestamps."),
                ("Neha Sharma", 295, 315, "Accent orange close to AuraNotes without cloning their logo. Dark text on light gray canvas."),
                ("Rajesh Patel", 315, 335, "Player keyboard shortcuts: space play/pause, j/l skip 5 seconds — nice polish if time."),
                ("Kavita Rao", 335, 355, "Only after sync works. Don't gold-plate."),
                ("Manish Yadav", 355, 375, "Decision time: ship Option A with responsive tabs, sticky player, orange accent, muted completed tasks."),
                ("Neha Sharma", 375, 395, "Locked. I'll update Figma tonight and start the detail page tomorrow morning."),
                ("Rajesh Patel", 395, 410, "I'll stub the player component API so Elena can wire clicks."),
                ("Kavita Rao", 410, 425, "I'll review the Figma async by EOD. Great session."),
                ("Neha Sharma", 425, 438, "Thanks all — critique adjourned."),
                ("Manish Yadav", 438, 445, "Thanks Elena."),
            ],
        )
        m6.summary = Summary(
            meeting_id=m6.id,
            overview_text=(
                "The team critiqued the transcript detail layout and aligned on a AuraNotes-like 60/40 "
                "split with responsive tabs on smaller screens. Engineering asked for a sticky top player "
                "to support seek sync and optional virtualization for long transcripts later. Product "
                "emphasized familiar patterns, clear empty-state copy, and deprioritizing keyboard polish "
                "until sync is solid. Elena will update Figma and begin implementation; Michael will stub "
                "the player component API."
            ),
            generated_at=now - timedelta(hours=5),
        )
        m6.key_topics = [
            KeyTopic(meeting_id=m6.id, topic_text="60/40 layout vs responsive tabs", order_index=0),
            KeyTopic(meeting_id=m6.id, topic_text="Sticky media player & seek sync", order_index=1),
            KeyTopic(meeting_id=m6.id, topic_text="Action items & empty states", order_index=2),
            KeyTopic(meeting_id=m6.id, topic_text="Typography, accent, and navbar chrome", order_index=3),
        ]
        m6.action_items = [
            ActionItem(meeting_id=m6.id, text="Update Figma for 60/40 + responsive tabs", assignee="Neha Sharma", is_completed=False, priority="medium"),
            ActionItem(meeting_id=m6.id, text="Stub player component API for transcript clicks", assignee="Rajesh Patel", is_completed=False, priority="medium"),
            ActionItem(meeting_id=m6.id, text="Async review Figma by EOD", assignee="Kavita Rao", is_completed=False, priority="medium"),
            ActionItem(meeting_id=m6.id, text="Add TODO for transcript list virtualization", assignee="Neha Sharma", is_completed=True, priority="low"),
            ActionItem(meeting_id=m6.id, text="Finalize orange accent tokens in theme", assignee="Neha Sharma", is_completed=False, priority="medium"),
        ]

        # ========== 7. Product Roadmap Review (hosted by demo user) ==========
        m7 = Meeting(
            title="Q3 Product Roadmap Review",
            date=now - timedelta(hours=5),
            duration_minutes=35,
            is_starred=True,
            created_at=now - timedelta(hours=5),
            updated_at=now - timedelta(hours=5),
        )
        m7.participants = _dedupe(
            [people["priya"], people["chris"], people["nina"]]
        )
        m7.tags = _dedupe([tags["planning"]])
        db.add(m7)
        db.flush()

        s7 = {
            "Manish Yadav": Speaker(meeting_id=m7.id, name="Manish Yadav", color=SPEAKER_COLORS[0]),
            "Neha Sharma": Speaker(meeting_id=m7.id, name="Neha Sharma", color=SPEAKER_COLORS[3]),
            "Rahul Verma": Speaker(meeting_id=m7.id, name="Rahul Verma", color=SPEAKER_COLORS[1]),
            "Kavita Rao": Speaker(meeting_id=m7.id, name="Kavita Rao", color=SPEAKER_COLORS[4]),
        }
        for sp in s7.values():
            db.add(sp)
        db.flush()

        m7.transcript_lines = _lines(
            m7,
            s7,
            [
                ("Manish Yadav", 0, 12, "Alright everyone, let's do our Q3 roadmap review. I want to align on what's shipping before end of September."),
                ("Neha Sharma", 12, 28, "From the design side, we have the new transcript highlighting feature ready for handoff. The annotation sidebar is 80% done."),
                ("Rahul Verma", 28, 45, "Backend-wise, the AI summary regeneration endpoint is live. We also finished the global search indexing — results are now sub-200ms."),
                ("Kavita Rao", 45, 60, "On my end, I've completed the export to Markdown and PDF. The Notion integration mockup is ready for review."),
                ("Manish Yadav", 60, 80, "Good progress. What's blocking the Notion integration from moving to development?"),
                ("Kavita Rao", 80, 98, "We're waiting on API key approval from Notion's developer program. I submitted the request two weeks ago."),
                ("Rahul Verma", 98, 115, "I can build out the OAuth flow in parallel so we're not blocked when keys arrive. Should take two days max."),
                ("Manish Yadav", 115, 132, "Great. Let's target Notion integration for mid-September. Kavita, keep nudging them on the API approval."),
                ("Neha Sharma", 132, 148, "Should we also look at Slack notifications? Users want to receive meeting summaries directly in their channels."),
                ("Manish Yadav", 148, 165, "Yes — let's scope that for September as well. Rahul, can you spike a Slack webhook prototype by next Friday?"),
                ("Rahul Verma", 165, 178, "Absolutely. I'll have a working demo to show. It's simpler than Notion — just outgoing webhooks."),
                ("Kavita Rao", 178, 195, "One concern: the current summary format might be too long for Slack. We should design a compact card format."),
                ("Neha Sharma", 195, 215, "I can design a compact Slack card this week. Will align with Slack's Block Kit constraints."),
                ("Manish Yadav", 215, 230, "Perfect. Let's also prioritize the mobile responsiveness fixes that came out of last week's user testing."),
                ("Rahul Verma", 230, 248, "I flagged three API response time regressions from the last deploy. Want me to address those before the Slack spike?"),
                ("Manish Yadav", 248, 265, "Yes — performance first. Fix the regressions by Wednesday, then switch to Slack."),
                ("Neha Sharma", 265, 280, "I'll get the mobile CSS fixes merged this afternoon. Small stuff, mostly padding and overflow issues."),
                ("Kavita Rao", 280, 295, "Should we do a mid-sprint demo for stakeholders? They were asking about progress on the AI features."),
                ("Manish Yadav", 295, 315, "Good idea. Let's schedule a 30-minute stakeholder demo for Thursday. I'll send the invite now."),
                ("Rahul Verma", 315, 328, "Works for me. I'll have the search performance numbers ready to share."),
                ("Neha Sharma", 328, 340, "Same. I'll prepare a quick slide on the annotation sidebar progress."),
                ("Manish Yadav", 340, 358, "Great session everyone. Let's wrap up. Next full roadmap sync is in two weeks."),
            ],
        )
        m7.summary = Summary(
            meeting_id=m7.id,
            overview_text=(
                "The Q3 product roadmap review covered progress on the annotation sidebar, AI summary regeneration, "
                "global search, export features, and upcoming integrations. Manish confirmed Notion integration "
                "is targeted for mid-September pending API approval, and a Slack webhook prototype is due by "
                "next Friday. Performance regressions are the top priority before feature work resumes. A "
                "stakeholder demo is scheduled for Thursday."
            ),
            generated_at=now - timedelta(hours=4),
        )
        m7.key_topics = [
            KeyTopic(meeting_id=m7.id, topic_text="Annotation sidebar & highlighting feature", order_index=0),
            KeyTopic(meeting_id=m7.id, topic_text="Notion integration — API approval pending", order_index=1),
            KeyTopic(meeting_id=m7.id, topic_text="Slack notifications prototype", order_index=2),
            KeyTopic(meeting_id=m7.id, topic_text="API performance regressions", order_index=3),
            KeyTopic(meeting_id=m7.id, topic_text="Stakeholder demo scheduling", order_index=4),
        ]
        m7.action_items = [
            ActionItem(meeting_id=m7.id, text="Fix three API response time regressions", assignee="Rahul Verma", is_completed=False, priority="high"),
            ActionItem(meeting_id=m7.id, text="Build Slack webhook OAuth flow in parallel", assignee="Rahul Verma", is_completed=False, priority="medium"),
            ActionItem(meeting_id=m7.id, text="Design compact Slack Block Kit card format", assignee="Neha Sharma", is_completed=False, priority="medium"),
            ActionItem(meeting_id=m7.id, text="Merge mobile CSS responsiveness fixes", assignee="Neha Sharma", is_completed=True, priority="low"),
            ActionItem(meeting_id=m7.id, text="Nudge Notion developer program on API key approval", assignee="Kavita Rao", is_completed=False, priority="medium"),
            ActionItem(meeting_id=m7.id, text="Schedule Thursday stakeholder demo invite", assignee="Manish Yadav", is_completed=True, priority="high"),
        ]

        # ========== 8. 1-on-1: Manish & Rahul (hosted by demo user) ==========
        m8 = Meeting(
            title="1:1 — Manish & Rahul",
            date=now - timedelta(days=2, hours=1),
            duration_minutes=28,
            is_starred=False,
            created_at=now - timedelta(days=2),
            updated_at=now - timedelta(days=2),
        )
        m8.participants = _dedupe([people["chris"]])
        m8.tags = _dedupe([tags["1:1"]])
        db.add(m8)
        db.flush()

        s8 = {
            "Manish Yadav": Speaker(meeting_id=m8.id, name="Manish Yadav", color=SPEAKER_COLORS[0]),
            "Rahul Verma": Speaker(meeting_id=m8.id, name="Rahul Verma", color=SPEAKER_COLORS[1]),
        }
        for sp in s8.values():
            db.add(sp)
        db.flush()

        m8.transcript_lines = _lines(
            m8,
            s8,
            [
                ("Manish Yadav", 0, 10, "Hey Rahul, how are you doing? What's on your mind this week?"),
                ("Rahul Verma", 10, 28, "Honestly, it's been a good week technically. I got the search indexing to sub-200ms. But I've been feeling a bit stretched — juggling backend and now the Notion scope."),
                ("Manish Yadav", 28, 48, "I hear you. That's fair feedback. I want to make sure the Notion spike doesn't land on you without support. Is there anything blocking you from delegating parts of it?"),
                ("Rahul Verma", 48, 65, "Amit could take the data model side if he's free. I'd keep the API layer. That might help."),
                ("Manish Yadav", 65, 82, "Let's set that up. I'll have a quick word with Amit today. You focus on the OAuth part."),
                ("Rahul Verma", 82, 98, "That would really help. Also — I wanted to flag the CI flake issue is back. It's intermittent but it's slowing down deploys."),
                ("Manish Yadav", 98, 118, "Noted. What's the root cause hypothesis?"),
                ("Rahul Verma", 118, 138, "Fixture teardown race condition in the transcript parser tests. I've seen it fail 3 out of 10 runs on main."),
                ("Manish Yadav", 138, 155, "That's above our threshold. Block it and fix it before end of week — don't let it ship to prod."),
                ("Rahul Verma", 155, 170, "Agreed. I'll isolate the fixture and add explicit teardown ordering. Should be a quick fix."),
                ("Manish Yadav", 170, 190, "On your growth goals — you mentioned wanting to do more system design work. How's that going?"),
                ("Rahul Verma", 190, 215, "I drafted the transcript ingest RFC last week. It covers dual format support, chunked search indexing, and async summarization. Could I get your review?"),
                ("Manish Yadav", 215, 235, "Absolutely — send it over after this. I'll review by Thursday. That kind of documentation is exactly what I want to see from you."),
                ("Rahul Verma", 235, 252, "Thanks, that means a lot. One last thing — any update on the senior engineer promotion timeline?"),
                ("Manish Yadav", 252, 278, "You're on track. The next review cycle is in October. Keep the RFC quality up and deliver the Q3 features cleanly and I'll advocate for you strongly."),
                ("Rahul Verma", 278, 292, "Got it. Thank you, really. Feeling much better about the next few months."),
                ("Manish Yadav", 292, 310, "Good. You're doing solid work. Let's check in again next week. Same time?"),
                ("Rahul Verma", 310, 320, "Works for me. See you then."),
            ],
        )
        m8.summary = Summary(
            meeting_id=m8.id,
            overview_text=(
                "Manish and Rahul's 1:1 covered workload balance, the CI pipeline flakiness issue, and Rahul's "
                "career development. Rahul flagged feeling stretched across backend and Notion work; Manish "
                "agreed to loop in Amit on the data model side. The recurring CI flake was escalated to a "
                "must-fix before end of week. Rahul shared his transcript ingest RFC and received positive "
                "feedback. Manish confirmed Rahul is on track for the October senior engineer review cycle."
            ),
            generated_at=now - timedelta(days=2),
        )
        m8.key_topics = [
            KeyTopic(meeting_id=m8.id, topic_text="Workload balance & Notion scope delegation", order_index=0),
            KeyTopic(meeting_id=m8.id, topic_text="CI fixture teardown flake — must-fix", order_index=1),
            KeyTopic(meeting_id=m8.id, topic_text="Transcript ingest RFC review", order_index=2),
            KeyTopic(meeting_id=m8.id, topic_text="Senior engineer promotion — October cycle", order_index=3),
        ]
        m8.action_items = [
            ActionItem(meeting_id=m8.id, text="Fix CI fixture teardown race condition before EOW", assignee="Rahul Verma", is_completed=False, priority="high"),
            ActionItem(meeting_id=m8.id, text="Review transcript ingest RFC by Thursday", assignee="Manish Yadav", is_completed=False, priority="medium"),
            ActionItem(meeting_id=m8.id, text="Loop in Amit Singh on Notion data model", assignee="Manish Yadav", is_completed=True, priority="medium"),
            ActionItem(meeting_id=m8.id, text="Share RFC doc with Manish post-call", assignee="Rahul Verma", is_completed=True, priority="low"),
        ]

        # ========== 9. Sales Pipeline Review (hosted by demo user) ==========
        m9 = Meeting(
            title="Sales Pipeline Review — July",
            date=now - timedelta(days=5, hours=3),
            duration_minutes=48,
            is_starred=False,
            created_at=now - timedelta(days=5),
            updated_at=now - timedelta(days=5),
        )
        m9.participants = _dedupe(
            [people["alex"], people["lena"], people["jordan"]]
        )
        m9.tags = _dedupe([tags["sales"]])
        db.add(m9)
        db.flush()

        s9 = {
            "Manish Yadav": Speaker(meeting_id=m9.id, name="Manish Yadav", color=SPEAKER_COLORS[0]),
            "Vikram Gupta": Speaker(meeting_id=m9.id, name="Vikram Gupta", color=SPEAKER_COLORS[1]),
            "Priya Desai": Speaker(meeting_id=m9.id, name="Priya Desai", color=SPEAKER_COLORS[2]),
            "Rajesh Patel": Speaker(meeting_id=m9.id, name="Rajesh Patel", color=SPEAKER_COLORS[3]),
        }
        for sp in s9.values():
            db.add(sp)
        db.flush()

        m9.transcript_lines = _lines(
            m9,
            s9,
            [
                ("Manish Yadav", 0, 12, "Let's start with the numbers. Where are we against the July target?"),
                ("Vikram Gupta", 12, 30, "We're at 68% of target with 8 days left in the month. TechNova and Synapse Dynamics are the two deals that could get us over the line."),
                ("Priya Desai", 30, 48, "TechNova is in legal review — their procurement team asked for a data processing agreement. I sent our standard DPA yesterday."),
                ("Manish Yadav", 48, 62, "What's the estimated close date? Legal reviews can stretch."),
                ("Priya Desai", 62, 80, "They said one week, but I've flagged it as 10 days to be safe. If legal clears by the 25th, we close by the 28th."),
                ("Rajesh Patel", 80, 98, "Synapse is a different story. Their CTO wants a 30-day pilot before signing. That pushes close to August."),
                ("Manish Yadav", 98, 118, "Can we structure the pilot as a conditional order? Commits them financially upfront with a 30-day satisfaction clause."),
                ("Vikram Gupta", 118, 140, "That's a good angle. I can propose it in tomorrow's call with their CTO. Rajesh, can you prepare the pilot success metrics doc?"),
                ("Rajesh Patel", 140, 158, "On it. I'll have a draft by tonight — response time benchmarks, summary accuracy on their call types, and action item extraction rate."),
                ("Priya Desai", 158, 175, "We also have two new inbound leads from the conference last week: Vertex Retail and CloudBridge."),
                ("Manish Yadav", 175, 192, "Good pipeline. What's the qualification status?"),
                ("Priya Desai", 192, 215, "Vertex is strong — team of 200, active Zoom users, budget confirmed. CloudBridge is smaller but they're evaluating three tools. Needs a strong demo."),
                ("Vikram Gupta", 215, 235, "I'll take Vertex. Rajesh, can you handle the CloudBridge discovery call? Walk them through the transcript and summary features."),
                ("Rajesh Patel", 235, 252, "Sure. I'll schedule for next Tuesday. Should I loop in a solution engineer?"),
                ("Manish Yadav", 252, 270, "Not yet — keep it lean for discovery. If they go technical, we bring in the engineer for the second call."),
                ("Vikram Gupta", 270, 290, "One more item: our churn rate ticked up last month. Two customers didn't renew — cited lack of CRM integration."),
                ("Manish Yadav", 290, 312, "That's a signal we can't ignore. I'll sync with product this week to get CRM integration on the H2 roadmap. Vikram, document the churn reasons for that conversation."),
                ("Priya Desai", 312, 330, "I can also set up exit interviews with both churned accounts if they're willing. Would give us richer data."),
                ("Manish Yadav", 330, 348, "Great idea — do it. Alright, let's close out. Vikram owns TechNova and Vertex, Rajesh handles Synapse pilot doc and CloudBridge discovery."),
                ("Vikram Gupta", 348, 360, "Got it. I'll update the CRM after this call."),
                ("Rajesh Patel", 360, 372, "Will have the pilot doc ready by tonight."),
                ("Manish Yadav", 372, 385, "Thanks everyone. Let's crush the last week of July."),
            ],
        )
        m9.summary = Summary(
            meeting_id=m9.id,
            overview_text=(
                "The July sales pipeline review covered progress against the monthly target (68%), with "
                "TechNova and Synapse Dynamics as the key deals. TechNova is in legal review with a "
                "projected close by the 28th. Synapse requires a 30-day pilot; Manish proposed a conditional "
                "order structure. Two conference leads — Vertex Retail and CloudBridge — were qualified. "
                "A churn spike linked to missing CRM integration was flagged for product roadmap escalation."
            ),
            generated_at=now - timedelta(days=5),
        )
        m9.key_topics = [
            KeyTopic(meeting_id=m9.id, topic_text="TechNova deal — legal DPA review", order_index=0),
            KeyTopic(meeting_id=m9.id, topic_text="Synapse Dynamics 30-day pilot proposal", order_index=1),
            KeyTopic(meeting_id=m9.id, topic_text="New inbound: Vertex Retail & CloudBridge", order_index=2),
            KeyTopic(meeting_id=m9.id, topic_text="Churn spike — CRM integration gap", order_index=3),
        ]
        m9.action_items = [
            ActionItem(meeting_id=m9.id, text="Prepare Synapse pilot success metrics doc", assignee="Rajesh Patel", is_completed=True, priority="high"),
            ActionItem(meeting_id=m9.id, text="Propose conditional order to Synapse CTO", assignee="Vikram Gupta", is_completed=False, priority="high"),
            ActionItem(meeting_id=m9.id, text="Schedule CloudBridge discovery call for Tuesday", assignee="Rajesh Patel", is_completed=False, priority="medium"),
            ActionItem(meeting_id=m9.id, text="Document churn reasons from two non-renewals", assignee="Vikram Gupta", is_completed=False, priority="medium"),
            ActionItem(meeting_id=m9.id, text="Set up exit interviews with churned accounts", assignee="Priya Desai", is_completed=False, priority="medium"),
            ActionItem(meeting_id=m9.id, text="Escalate CRM integration to H2 product roadmap", assignee="Manish Yadav", is_completed=False, priority="high"),
        ]

        # Attach all meetings to the demo login account.
        # m1–m3 + m7–m9: Hosted by demo user | m4–m6: Shared (owner=None)
        hosted = [m1, m2, m3, m7, m8, m9]
        shared = [m4, m5, m6]
        for m in hosted:
            m.owner_id = demo_user.id
            m.participants = _dedupe([people["demo"], *list(m.participants)])
        for m in shared:
            m.owner_id = None
            m.participants = _dedupe([people["demo"], *list(m.participants)])

        db.commit()

        count = db.query(Meeting).count()
        lines = db.query(TranscriptLine).count()
        actions = db.query(ActionItem).count()
        print(f"Seeded {count} meetings, {lines} transcript lines, {actions} action items")
        print(f"Demo login: {DEMO_EMAIL} / {DEMO_PASSWORD} ({DEMO_NAME})")
        print(f"Database: {DATABASE_URL}")
    finally:
        db.close()


if __name__ == "__main__":
    seed()
