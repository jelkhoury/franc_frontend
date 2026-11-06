from pathlib import Path

from reportlab.lib import colors
from reportlab.lib.enums import TA_CENTER, TA_LEFT
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import ParagraphStyle, getSampleStyleSheet
from reportlab.lib.units import mm
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.pdfbase import pdfmetrics
from reportlab.platypus import (
    BaseDocTemplate,
    Flowable,
    Frame,
    KeepTogether,
    PageBreak,
    PageTemplate,
    Paragraph,
    Spacer,
    Table,
    TableStyle,
)


ROOT = Path(__file__).resolve().parents[2]
OUTPUT = ROOT / "output" / "pdf" / "franc-career-pulse-proposal.pdf"
OUTPUT.parent.mkdir(parents=True, exist_ok=True)

PAGE_W, PAGE_H = A4
BLUE = colors.HexColor("#3E79BD")
DARK_BLUE = colors.HexColor("#17466F")
YELLOW = colors.HexColor("#F9C515")
INK = colors.HexColor("#223344")
MUTED = colors.HexColor("#607080")
PALE_BLUE = colors.HexColor("#EBF2FF")
PALE_YELLOW = colors.HexColor("#FFF8D8")
PALE_GRAY = colors.HexColor("#F5F7FA")
GREEN = colors.HexColor("#2F855A")
WHITE = colors.white


def register_fonts():
    candidates = [
        (
            "/System/Library/Fonts/Supplemental/Arial.ttf",
            "/System/Library/Fonts/Supplemental/Arial Bold.ttf",
        ),
        (
            "/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf",
            "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf",
        ),
    ]
    for regular, bold in candidates:
        if Path(regular).exists() and Path(bold).exists():
            pdfmetrics.registerFont(TTFont("FrancSans", regular))
            pdfmetrics.registerFont(TTFont("FrancSansBold", bold))
            return "FrancSans", "FrancSansBold"
    return "Helvetica", "Helvetica-Bold"


FONT, FONT_BOLD = register_fonts()


class BrandMark(Flowable):
    def __init__(self, width=46 * mm, height=23 * mm):
        super().__init__()
        self.width = width
        self.height = height

    def draw(self):
        c = self.canv
        c.setFillColor(BLUE)
        c.roundRect(0, 0, self.width, self.height, 6 * mm, fill=1, stroke=0)
        c.setFillColor(YELLOW)
        c.circle(12 * mm, self.height / 2, 6.5 * mm, fill=1, stroke=0)
        c.setFillColor(DARK_BLUE)
        c.setFont(FONT_BOLD, 18)
        c.drawCentredString(12 * mm, self.height / 2 - 2.4 * mm, "F")
        c.setFillColor(WHITE)
        c.setFont(FONT_BOLD, 16)
        c.drawString(22 * mm, self.height / 2 - 2.1 * mm, "FRANC")


class PulseLine(Flowable):
    def __init__(self, width=150 * mm, height=22 * mm):
        super().__init__()
        self.width = width
        self.height = height

    def draw(self):
        c = self.canv
        y = self.height / 2
        pts = [
            (0, y),
            (28 * mm, y),
            (36 * mm, y + 2 * mm),
            (43 * mm, y - 3 * mm),
            (51 * mm, y + 9 * mm),
            (60 * mm, y - 10 * mm),
            (68 * mm, y + 3 * mm),
            (77 * mm, y),
            (self.width, y),
        ]
        c.setStrokeColor(BLUE)
        c.setLineWidth(2.8)
        path = c.beginPath()
        path.moveTo(*pts[0])
        for x, py in pts[1:]:
            path.lineTo(x, py)
        c.drawPath(path, stroke=1, fill=0)
        c.setFillColor(YELLOW)
        c.circle(51 * mm, y + 9 * mm, 2.5 * mm, fill=1, stroke=0)


class StepFlow(Flowable):
    def __init__(self, labels, width=166 * mm, height=24 * mm):
        super().__init__()
        self.labels = labels
        self.width = width
        self.height = height

    def draw(self):
        c = self.canv
        n = len(self.labels)
        gap = 4 * mm
        box_w = (self.width - gap * (n - 1)) / n
        for i, label in enumerate(self.labels):
            x = i * (box_w + gap)
            c.setFillColor(PALE_BLUE if i % 2 == 0 else PALE_YELLOW)
            c.roundRect(x, 0, box_w, self.height, 3 * mm, fill=1, stroke=0)
            c.setFillColor(DARK_BLUE)
            c.setFont(FONT_BOLD, 8.5)
            words = label.split(" ")
            if len(words) > 2:
                cut = max(1, len(words) // 2)
                lines = [" ".join(words[:cut]), " ".join(words[cut:])]
            else:
                lines = [label]
            base_y = self.height / 2 + (3 if len(lines) == 2 else -2)
            for j, line in enumerate(lines):
                c.drawCentredString(x + box_w / 2, base_y - j * 10, line)
            if i < n - 1:
                ax = x + box_w + 0.7 * mm
                ay = self.height / 2
                c.setStrokeColor(BLUE)
                c.setFillColor(BLUE)
                c.setLineWidth(1.2)
                c.line(ax, ay, ax + 2.6 * mm, ay)
                p = c.beginPath()
                p.moveTo(ax + 2.6 * mm, ay)
                p.lineTo(ax + 1.2 * mm, ay + 1.2 * mm)
                p.lineTo(ax + 1.2 * mm, ay - 1.2 * mm)
                p.close()
                c.drawPath(p, fill=1, stroke=0)


styles = getSampleStyleSheet()
styles.add(
    ParagraphStyle(
        name="CoverKicker",
        fontName=FONT_BOLD,
        fontSize=10,
        leading=13,
        textColor=BLUE,
        spaceAfter=5 * mm,
        uppercase=True,
    )
)
styles.add(
    ParagraphStyle(
        name="CoverTitle",
        fontName=FONT_BOLD,
        fontSize=31,
        leading=35,
        textColor=DARK_BLUE,
        spaceAfter=5 * mm,
    )
)
styles.add(
    ParagraphStyle(
        name="CoverSub",
        fontName=FONT,
        fontSize=14,
        leading=21,
        textColor=MUTED,
        spaceAfter=8 * mm,
    )
)
styles.add(
    ParagraphStyle(
        name="H1Brand",
        fontName=FONT_BOLD,
        fontSize=22,
        leading=27,
        textColor=DARK_BLUE,
        spaceAfter=5 * mm,
    )
)
styles.add(
    ParagraphStyle(
        name="H2Brand",
        fontName=FONT_BOLD,
        fontSize=13,
        leading=17,
        textColor=BLUE,
        spaceBefore=2 * mm,
        spaceAfter=2.5 * mm,
    )
)
styles.add(
    ParagraphStyle(
        name="BodyBrand",
        fontName=FONT,
        fontSize=9.5,
        leading=14.2,
        textColor=INK,
        spaceAfter=3 * mm,
    )
)
styles.add(
    ParagraphStyle(
        name="SmallBrand",
        fontName=FONT,
        fontSize=8.2,
        leading=11.4,
        textColor=MUTED,
    )
)
styles.add(
    ParagraphStyle(
        name="CardTitle",
        fontName=FONT_BOLD,
        fontSize=10,
        leading=13,
        textColor=DARK_BLUE,
        spaceAfter=1.5 * mm,
    )
)
styles.add(
    ParagraphStyle(
        name="CardBody",
        fontName=FONT,
        fontSize=8.4,
        leading=12,
        textColor=INK,
    )
)
styles.add(
    ParagraphStyle(
        name="Quote",
        fontName=FONT_BOLD,
        fontSize=13,
        leading=19,
        textColor=DARK_BLUE,
        alignment=TA_CENTER,
    )
)
styles.add(
    ParagraphStyle(
        name="TableHead",
        fontName=FONT_BOLD,
        fontSize=8.1,
        leading=10.5,
        textColor=WHITE,
        alignment=TA_LEFT,
    )
)
styles.add(
    ParagraphStyle(
        name="TableText",
        fontName=FONT,
        fontSize=7.7,
        leading=10.4,
        textColor=INK,
    )
)


def P(text, style="BodyBrand"):
    return Paragraph(text, styles[style])


def bullet(text):
    return Paragraph(f"<font color='#3E79BD'><b>+</b></font>&nbsp;&nbsp;{text}", styles["BodyBrand"])


def callout(title, body, bg=PALE_BLUE, accent=BLUE):
    table = Table(
        [[P(title, "CardTitle"), P(body, "CardBody")]],
        colWidths=[42 * mm, 119 * mm],
        hAlign="LEFT",
    )
    table.setStyle(
        TableStyle(
            [
                ("BACKGROUND", (0, 0), (-1, -1), bg),
                ("BOX", (0, 0), (-1, -1), 0.8, accent),
                ("LINEBEFORE", (0, 0), (0, -1), 4, accent),
                ("VALIGN", (0, 0), (-1, -1), "TOP"),
                ("LEFTPADDING", (0, 0), (-1, -1), 10),
                ("RIGHTPADDING", (0, 0), (-1, -1), 10),
                ("TOPPADDING", (0, 0), (-1, -1), 9),
                ("BOTTOMPADDING", (0, 0), (-1, -1), 9),
            ]
        )
    )
    return table


def two_cards(cards):
    rows = []
    for i in range(0, len(cards), 2):
        pair = cards[i : i + 2]
        row = []
        for title, body in pair:
            content = Table(
                [[P(title, "CardTitle")], [P(body, "CardBody")]],
                colWidths=[78 * mm],
            )
            content.setStyle(
                TableStyle(
                    [
                        ("BACKGROUND", (0, 0), (-1, -1), PALE_GRAY),
                        ("BOX", (0, 0), (-1, -1), 0.5, colors.HexColor("#DDE5EC")),
                        ("LEFTPADDING", (0, 0), (-1, -1), 9),
                        ("RIGHTPADDING", (0, 0), (-1, -1), 9),
                        ("TOPPADDING", (0, 0), (-1, -1), 8),
                        ("BOTTOMPADDING", (0, 0), (-1, -1), 8),
                    ]
                )
            )
            row.append(content)
        if len(row) == 1:
            row.append("")
        rows.append(row)
    outer = Table(rows, colWidths=[81 * mm, 81 * mm], hAlign="LEFT")
    outer.setStyle(
        TableStyle(
            [
                ("VALIGN", (0, 0), (-1, -1), "TOP"),
                ("LEFTPADDING", (0, 0), (-1, -1), 0),
                ("RIGHTPADDING", (0, 0), (-1, -1), 3 * mm),
                ("TOPPADDING", (0, 0), (-1, -1), 0),
                ("BOTTOMPADDING", (0, 0), (-1, -1), 3 * mm),
            ]
        )
    )
    return outer


def page_header_footer(canvas, doc):
    canvas.saveState()
    if doc.page > 1:
        canvas.setFillColor(BLUE)
        canvas.rect(0, PAGE_H - 12 * mm, PAGE_W, 12 * mm, fill=1, stroke=0)
        canvas.setFillColor(WHITE)
        canvas.setFont(FONT_BOLD, 8.5)
        canvas.drawString(20 * mm, PAGE_H - 7.5 * mm, "FRANC  |  CAREER PULSE")
    canvas.setStrokeColor(colors.HexColor("#D8E1EA"))
    canvas.setLineWidth(0.5)
    canvas.line(20 * mm, 14 * mm, PAGE_W - 20 * mm, 14 * mm)
    canvas.setFillColor(MUTED)
    canvas.setFont(FONT, 7.5)
    canvas.drawString(20 * mm, 9 * mm, "Product and service proposal")
    canvas.drawRightString(PAGE_W - 20 * mm, 9 * mm, f"{doc.page}")
    canvas.restoreState()


def build_story():
    story = []

    # Cover
    story += [Spacer(1, 10 * mm), BrandMark(), Spacer(1, 17 * mm)]
    story += [P("PRODUCT CONCEPT PROPOSAL", "CoverKicker")]
    story += [P("Career Pulse", "CoverTitle")]
    story += [
        P(
            "An AI-assisted career check-in that understands how a student feels about their career journey and guides them to the most useful next step in Franc.",
            "CoverSub",
        )
    ]
    story += [PulseLine(), Spacer(1, 11 * mm)]
    story += [
        callout(
            "Core recommendation",
            "Position Career Pulse as Franc's personalization and routing layer. It should help a student identify their current career state, receive one clear action, and move directly into the right Franc service.",
            bg=PALE_YELLOW,
            accent=YELLOW,
        ),
        Spacer(1, 10 * mm),
    ]
    cover_cards = [
        ("Fast", "A guided check-in that takes about two minutes."),
        ("Supportive", "Warm language that reduces uncertainty and encourages action."),
        ("Personalized", "Recommendations based on the student's answers and context."),
        ("Connected", "Routes users into Franc's existing career services."),
    ]
    story += [two_cards(cover_cards), Spacer(1, 7 * mm)]
    story += [P("Prepared for Franc - Antonine University Career Support", "SmallBrand")]
    story += [PageBreak()]

    # Page 2
    story += [P("1. Strategic fit", "H1Brand")]
    story += [
        P(
            "Franc already supports career discovery, preparation, opportunity search, and decision-making. Career Pulse becomes the intelligent front door that helps each student decide where to begin.",
            "BodyBrand",
        ),
        Spacer(1, 3 * mm),
        StepFlow(["Discover", "Prepare", "Find opportunities", "Decide"]),
        Spacer(1, 6 * mm),
        P("Why it belongs in Franc", "H2Brand"),
        two_cards(
            [
                ("Solves the starting-point problem", "Students often know they need career help but do not know which service or task matters first."),
                ("Extends Franc's personality", "The concept matches Franc's friendly, encouraging, student-focused tone."),
                ("Creates service continuity", "A check-in can connect discovery, application preparation, interview practice, and job decisions."),
                ("Builds useful progress signals", "Optional repeat check-ins can show how confidence, clarity, and readiness change over time."),
            ]
        ),
        P("Recommended positioning", "H2Brand"),
        callout(
            "Career Pulse",
            "Answer a few quick questions. Franc understands your current career state and recommends the best next step.",
        ),
        Spacer(1, 5 * mm),
        P("Where users should find it", "H2Brand"),
        bullet("Place a prominent 'Not sure where to begin?' prompt above the service catalogue."),
        bullet("Offer the check-in from Franc's career chat when a user expresses confusion or uncertainty."),
        bullet("Invite users to check in again after completing a major service or career milestone."),
        Spacer(1, 3 * mm),
        callout(
            "Naming guidance",
            "Use 'Career Pulse' or 'Career Check-In.' Avoid 'Mood Detector': Franc is helping the student reflect and choose an action, not making a mental-health diagnosis.",
            bg=PALE_YELLOW,
            accent=YELLOW,
        ),
        PageBreak(),
    ]

    # Page 3
    story += [P("2. Student experience", "H1Brand")]
    story += [
        P(
            "The interaction should feel lighter than an assessment and more useful than a generic chatbot response. A student should leave with a clear explanation, one primary recommendation, and one small action they can complete today.",
            "BodyBrand",
        ),
        Spacer(1, 3 * mm),
        StepFlow(["Welcome", "6-8 questions", "Career state", "Next action", "Optional tracking"]),
        Spacer(1, 7 * mm),
        P("Suggested question set", "H2Brand"),
    ]
    question_data = [
        [P("Area", "TableHead"), P("Example statement", "TableHead"), P("Response", "TableHead")],
        [P("Clarity", "TableText"), P("I know what career direction I want to pursue.", "TableText"), P("1 to 5", "TableText")],
        [P("Confidence", "TableText"), P("I feel confident about my next career step.", "TableText"), P("1 to 5", "TableText")],
        [P("Energy", "TableText"), P("I have enough energy to work on my career today.", "TableText"), P("1 to 5", "TableText")],
        [P("Readiness", "TableText"), P("I feel prepared to apply for opportunities.", "TableText"), P("1 to 5", "TableText")],
        [P("Pressure", "TableText"), P("I am worried about making the wrong career decision.", "TableText"), P("1 to 5", "TableText")],
        [P("Focus", "TableText"), P("I know which career task I should focus on first.", "TableText"), P("1 to 5", "TableText")],
        [P("Momentum", "TableText"), P("I have made career progress recently.", "TableText"), P("1 to 5", "TableText")],
        [P("Context", "TableText"), P("What is the biggest career challenge on your mind?", "TableText"), P("Optional text", "TableText")],
    ]
    qt = Table(question_data, colWidths=[27 * mm, 105 * mm, 29 * mm], repeatRows=1)
    qt.setStyle(
        TableStyle(
            [
                ("BACKGROUND", (0, 0), (-1, 0), BLUE),
                ("ROWBACKGROUNDS", (0, 1), (-1, -1), [WHITE, PALE_GRAY]),
                ("GRID", (0, 0), (-1, -1), 0.4, colors.HexColor("#CDD9E5")),
                ("VALIGN", (0, 0), (-1, -1), "TOP"),
                ("LEFTPADDING", (0, 0), (-1, -1), 7),
                ("RIGHTPADDING", (0, 0), (-1, -1), 7),
                ("TOPPADDING", (0, 0), (-1, -1), 6),
                ("BOTTOMPADDING", (0, 0), (-1, -1), 6),
            ]
        )
    )
    story += [qt, Spacer(1, 6 * mm)]
    story += [
        P("Result format", "H2Brand"),
        callout(
            "Your Career Pulse: Preparing, but uncertain",
            "You appear motivated to move forward, but you may need more confidence in your application. Start with Resume Feedback, then use Mock Interview. Your action for today: upload your current CV and improve the three areas with the biggest impact.",
            bg=PALE_BLUE,
            accent=BLUE,
        ),
        PageBreak(),
    ]

    # Page 4
    story += [P("3. Career states and service routing", "H1Brand")]
    story += [
        P(
            "The result should describe a practical career state. It should never label the user with a medical or psychological condition. Each state should connect directly to an action Franc can support.",
            "BodyBrand",
        )
    ]
    state_data = [
        [P("Career state", "TableHead"), P("What the answers suggest", "TableHead"), P("Recommended Franc path", "TableHead")],
        [P("Exploring", "TableText"), P("Low clarity with curiosity or willingness to learn.", "TableText"), P("Personality Test; Values and Interests", "TableText")],
        [P("Confused", "TableText"), P("Several possible directions and difficulty choosing.", "TableText"), P("Career Chat; Job Comparison", "TableText")],
        [P("Preparing", "TableText"), P("A goal exists, but application materials need work.", "TableText"), P("Resume Feedback; Cover Letter Feedback", "TableText")],
        [P("Nervous", "TableText"), P("The next opportunity is clear, but confidence is low.", "TableText"), P("Mock Interview; Career Quest", "TableText")],
        [P("Stuck", "TableText"), P("Low momentum and uncertainty about the first action.", "TableText"), P("Career Chat with a short action plan", "TableText")],
        [P("Ready", "TableText"), P("High clarity, confidence, and willingness to act.", "TableText"), P("Job Matching; Career Quest", "TableText")],
        [P("Overloaded", "TableText"), P("High pressure, low energy, or too many competing tasks.", "TableText"), P("Prioritized micro-plan before another service", "TableText")],
    ]
    st = Table(state_data, colWidths=[28 * mm, 67 * mm, 66 * mm], repeatRows=1)
    st.setStyle(
        TableStyle(
            [
                ("BACKGROUND", (0, 0), (-1, 0), BLUE),
                ("ROWBACKGROUNDS", (0, 1), (-1, -1), [WHITE, PALE_GRAY]),
                ("GRID", (0, 0), (-1, -1), 0.45, colors.HexColor("#C8D7E5")),
                ("VALIGN", (0, 0), (-1, -1), "TOP"),
                ("LEFTPADDING", (0, 0), (-1, -1), 7),
                ("RIGHTPADDING", (0, 0), (-1, -1), 7),
                ("TOPPADDING", (0, 0), (-1, -1), 7),
                ("BOTTOMPADDING", (0, 0), (-1, -1), 7),
            ]
        )
    )
    story += [st, Spacer(1, 7 * mm)]
    story += [
        P("Recommendation design rules", "H2Brand"),
        two_cards(
            [
                ("One primary action", "Name the single highest-value next step. Too many choices can recreate the confusion the service is meant to reduce."),
                ("One secondary option", "Offer a useful alternative when the student is not ready for the main action."),
                ("Explain the reason", "Connect the recommendation to the student's answers using supportive, plain language."),
                ("Make it actionable", "Deep-link into the recommended service and preserve relevant context when possible."),
            ]
        ),
        PageBreak(),
    ]

    # Page 5
    story += [P("4. AI and decision approach", "H1Brand")]
    story += [
        callout(
            "Recommended architecture",
            "Use a transparent scoring model to identify the career state, then use AI to interpret optional text and write the personalized explanation. This keeps results consistent while preserving Franc's conversational personality.",
        ),
        Spacer(1, 7 * mm),
        P("What the scoring layer should do", "H2Brand"),
        bullet("Convert 1-to-5 responses into dimensions such as clarity, confidence, energy, readiness, pressure, focus, and momentum."),
        bullet("Apply documented thresholds and combinations to identify a primary state and, when useful, a secondary state."),
        bullet("Return a service route from an approved mapping table."),
        bullet("Store a version number with each result so future scoring changes remain traceable."),
        Spacer(1, 3 * mm),
        P("What the AI layer should do", "H2Brand"),
        bullet("Summarize the optional free-text response without changing the scored state on weak evidence."),
        bullet("Write an empathetic explanation using Franc's warm, student-friendly voice."),
        bullet("Personalize the recommended action using the student's immediate context."),
        bullet("Stay within approved career-support guidance and avoid diagnostic language."),
        Spacer(1, 4 * mm),
        P("High-level product flow", "H2Brand"),
        StepFlow(["Answers", "Scoring rules", "Career state", "AI explanation", "Service route"]),
        Spacer(1, 7 * mm),
        two_cards(
            [
                ("Minimum data object", "Check-in ID, date, dimension scores, primary state, optional secondary state, recommendation, completion status, and scoring version."),
                ("Tracking view", "A simple private timeline such as Overloaded -> Exploring -> Preparing -> Ready, with dates and completed actions."),
                ("Fallback behavior", "If AI generation fails, show a reviewed template for the scored state so the student still receives a useful result."),
                ("Quality control", "Test identical answer sets for stable classification and review generated copy for tone, accuracy, and unsafe claims."),
            ]
        ),
        PageBreak(),
    ]

    # Page 6
    story += [P("5. Trust, rollout, and success", "H1Brand")]
    story += [
        P("Trust and privacy requirements", "H2Brand"),
        bullet("Tell students what is collected, why it is used, and whether it will be saved before the check-in begins."),
        bullet("Make history optional and give users a clear way to delete individual check-ins or their full history."),
        bullet("Do not infer mood from the camera, microphone, browsing behavior, or unrelated activity."),
        bullet("Keep the service focused on career support. Do not present results as mental-health advice or diagnosis."),
        bullet("Define a reviewed support response for messages that indicate immediate personal danger or crisis."),
        Spacer(1, 4 * mm),
        P("Recommended launch plan", "H2Brand"),
    ]
    rollout = [
        [P("Phase", "TableHead"), P("Scope", "TableHead"), P("Decision gate", "TableHead")],
        [P("1. Prototype", "TableText"), P("Static question flow, rule-based states, reviewed result templates, no history.", "TableText"), P("Do students understand and trust the result?", "TableText")],
        [P("2. Pilot", "TableText"), P("AI-written explanations, optional text, deep-links to services, limited student group.", "TableText"), P("Do recommendations lead to useful service starts?", "TableText")],
        [P("3. Tracking", "TableText"), P("Consent-based history, progress timeline, repeat check-ins, reminders.", "TableText"), P("Does tracking improve follow-through without creating pressure?", "TableText")],
    ]
    rt = Table(rollout, colWidths=[28 * mm, 73 * mm, 60 * mm], repeatRows=1)
    rt.setStyle(
        TableStyle(
            [
                ("BACKGROUND", (0, 0), (-1, 0), BLUE),
                ("ROWBACKGROUNDS", (0, 1), (-1, -1), [WHITE, PALE_GRAY]),
                ("GRID", (0, 0), (-1, -1), 0.4, colors.HexColor("#CDD9E5")),
                ("VALIGN", (0, 0), (-1, -1), "TOP"),
                ("LEFTPADDING", (0, 0), (-1, -1), 7),
                ("RIGHTPADDING", (0, 0), (-1, -1), 7),
                ("TOPPADDING", (0, 0), (-1, -1), 7),
                ("BOTTOMPADDING", (0, 0), (-1, -1), 7),
            ]
        )
    )
    story += [rt, Spacer(1, 5 * mm)]
    story += [
        P("Success measures", "H2Brand"),
        bullet("Check-in completion rate and average completion time."),
        bullet("Percentage of users who start the recommended Franc service."),
        bullet("Percentage who complete the recommended action."),
        bullet("Student rating of whether the result felt accurate, useful, and respectful."),
        bullet("Repeat check-in rate and movement in clarity, confidence, or readiness."),
        Spacer(1, 4 * mm),
        P("Ready-to-use service card", "H2Brand"),
        callout(
            "Career Pulse  |  Button: Check My Pulse",
            "How are you feeling about your career today? Let Franc understand your current state and recommend your best next step.",
            bg=PALE_YELLOW,
            accent=YELLOW,
        ),
        Spacer(1, 6 * mm),
        P(
            "Career Pulse should launch first as a short, transparent career check-in. Its strongest business value is helping every student enter Franc through the right door and increasing meaningful use of the services Franc already provides.",
            "Quote",
        ),
    ]

    return story


def main():
    doc = BaseDocTemplate(
        str(OUTPUT),
        pagesize=A4,
        rightMargin=20 * mm,
        leftMargin=20 * mm,
        topMargin=19 * mm,
        bottomMargin=18 * mm,
        title="Franc Career Pulse - Product and Service Proposal",
        author="Franc Product Proposal",
        subject="AI-assisted career mood check-in and service routing concept",
    )
    frame = Frame(doc.leftMargin, doc.bottomMargin, doc.width, doc.height, id="main")
    template = PageTemplate(id="brand", frames=[frame], onPage=page_header_footer)
    doc.addPageTemplates([template])
    doc.build(build_story())
    print(OUTPUT)


if __name__ == "__main__":
    main()
