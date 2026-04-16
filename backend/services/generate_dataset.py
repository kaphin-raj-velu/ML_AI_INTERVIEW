import json
import random
import os

def generate_huge_dataset():
    tech_stacks = ["React", "Python", "Docker", "Kubernetes", "Redis", "Kafka", "AWS", "TensorFlow", "Postgres", "GraphQL", "Azure", "GCP", "Next.js", "Vue", "Angular", "NoSQL", "Snowflake", "Spark"]
    concepts = ["state management", "performance", "scalability", "latency", "recursion", "algorithms", "sharding", "auth", "CI/CD", "caching", "monitoring", "serverless", "microservices", "testing"]
    roles = ["Frontend", "Backend", "Fullstack", "DevOps", "Data Science", "Mobile", "Security", "ML Engineer"]
    
    technical_safe = []
    # Generate 1000+ Technical Questions
    for stack in tech_stacks:
        for concept in concepts:
            technical_safe.append(f"How do you handle {stack} {concept} in a high-traffic environment?")
            technical_safe.append(f"What are the best practices for {stack} {concept}?")
            technical_safe.append(f"Can you explain {concept} within the context of {stack} architecture?")
            technical_safe.append(f"Explain the difference between {stack} {concept} and {random.choice(concepts)}.")
            technical_safe.append(f"In {stack}, how does {concept} impact system availability?")

    behavioral_safe = [
        "Tell me about a time you handled a conflict.",
        "How do you prioritize tasks under a tight deadline?",
        "Describe a difficult technical challenge you solved.",
        "What is your approach to code reviews?",
        "How do you stay updated with industry trends?",
        "Tell me about a project you are proud of.",
        "How do you handle feedback from colleagues?",
        "Describe a situation where you had to lead a team through a crisis.",
        "What is your communication style with stakeholders?",
        "How do you handle high-pressure situations, like a stress interview?",
        "Can you describe our company values and how you align with them?",
        "What motivated you to apply for this specific role at our company?",
        "How do you handle ethical dilemmas in the workplace?",
        "Describe your experience working in diverse team environments.",
        "How do you handle mistakes or failures in your work?",
        "What are your long-term career goals within this organization?",
        "How do you react when you are faced with a task that you don't know how to complete?",
        "Describe a time when you had to work under a very tight deadline with limited resources.",
        "What is your greatest weakness and how are you working to improve it?",
        "Tell me about a time you had a major conflict with a manager.",
        "How do you handle criticism of your work during a code review?",
        "Describe a situation where you had to work with extremely difficult colleagues.",
        "How do you prioritize your work when you have multiple projects with overlapping deadlines?",
        "What would you do if you were halfway through a project and realized you had made a significant technical mistake?",
        "Give an example of a time when you had to explain a complex technical concept to a non-technical stakeholder under pressure.",
        "How do you maintain your productivity and focus when the project requirements are constantly changing?",
        "Describe a time when you had to take lead on a project because someone else failed to deliver.",
        "What is your strategy for handling an aggressive or confrontational interviewer during a stress interview?",
        "Tell me about a time you had to deliver bad news to your team or client.",
        "How do you handle the pressure of live production outages and system failures?"
    ]

    biased_scenarios = [
        # Gender & Family
        {"q": "Are you planning to have children soon?", "type": "B"},
        {"q": "Is your spouse okay with you working nights?", "type": "B"},
        {"q": "Do you have a babysitter for your kids?", "type": "B"},
        {"q": "Are you married?", "type": "B"},
        {"q": "What does your husband think about this career move?", "type": "B"},
        {"q": "Will your family commitments interfere with travel?", "type": "B"},
        {"q": "Are you a single parent?", "type": "B"},
        {"q": "Does your wife work as well?", "type": "B"},
        
        # Age
        {"q": "How old are you exactly?", "type": "B"},
        {"q": "You seem energetic for your age, how do you do it?", "type": "B"},
        {"q": "Are you a digital native?", "type": "B"},
        {"q": "When do you plan to retire?", "type": "B"},
        {"q": "Do you prefer a young team?", "type": "B"},
        {"q": "How many more years do you see yourself working?", "type": "B"},
        {"q": "Are you comfortable reporting to someone much younger than you?", "type": "B"},
        {"q": "When did you graduate from high school?", "type": "B"},
        {"q": "Is this your last job before retirement?", "type": "B"},

        # Origin / Race / Religion
        {"q": "Where were you originally born?", "type": "B"},
        {"q": "What is your native language?", "type": "B"},
        {"q": "Which neighborhood did you grow up in?", "type": "B"},
        {"q": "What is your religion?", "type": "B"},
        {"q": "Where is your accent from?", "type": "B"},
        {"q": "Do you need a visa to work here?", "type": "B"},
        {"q": "Are you a citizen of this country?", "type": "B"},
        {"q": "What church do you go to?", "type": "B"},
        {"q": "Do you celebrate religious holidays that require time off?", "type": "B"},
        {"q": "Are you from the 'good' part of town?", "type": "B"},
        
        # Health / Ability
        {"q": "Do you have any health issues we should know about?", "type": "B"},
        {"q": "Have you ever taken a long medical leave?", "type": "B"},
        {"q": "Are you on any medication that affects your work?", "type": "B"},
        {"q": "Do you have any physical limitations?", "type": "B"},
        {"q": "How is your mental health?", "type": "B"}
    ]

    # Generate 500+ Mixed Mock Challenges for the Lab
    mock_sessions = []
    # 200 Technical Secure
    for i in range(200):
        mock_sessions.append({"q": random.choice(technical_safe), "type": "S"})
    # 150 Behavioral Secure
    for i in range(150):
        mock_sessions.append({"q": random.choice(behavioral_safe), "type": "S"})
    # 150 Biased Challenges
    for i in range(150):
        mock_sessions.append(random.choice(biased_scenarios))

    random.shuffle(mock_sessions)

    data = {
        "domains": {
            "Software Engineering": {
                "safe_contexts": [
                    "parent process", "child node", "parent component", "child component", "parent class", "child class",
                    "native app", "native mobile", "native code", "cloud native", "react native", "native bridge",
                    "background task", "background process", "background job", "background sync", "background thread",
                    "stress test", "load testing", "performance testing", "fuzz testing",
                    "garbage collection", "memory management", "pointers", "recursion",
                    "inheritance", "class hierarchy", "binary tree", "linked list", "dag",
                    "react hooks", "state management", "props drilling", "context api", "redux", "zustand",
                    "kubernetes", "docker", "terraform", "ansible", "jenkins", "github actions",
                    "binary search", "depth first search", "breadth first search",
                    "frontend developer", "backend architecture", "fullstack engineer",
                    "master branch", "slave node", "whitelist", "blacklist", "grandfathered"
                ],
                "technical_keywords": [
                    "algorithm", "complexity", "database", "query", "optimization", "sql", "nosql", "mongodb", "postgres",
                    "deploy", "staging", "production", "refactor", "unit test", "api", "rest", "graphql", "grpc",
                    "integration", "docker", "kubernetes", "autoscaling", "shard", "replication",
                    "encryption", "auth", "token", "payload", "endpoint", "middleware", "latency", "throughput",
                    "git", "branch", "merge", "commit", "pull request", "rebase", "aws", "azure", "gcp", "lambda",
                    "react", "vue", "angular", "node", "javascript", "typescript", "python", "java",
                    "golang", "rust", "c++", "c#", "ruby", "php", "swift", "kotlin", "flutter",
                    "devops", "cloud", "microservices", "frontend", "backend", "fullstack"
                ]
            },
            "Professional & Company": {
                "safe_contexts": [
                    "stress interview", "pressure management", "corporate culture", "company values",
                    "mission statement", "professional growth", "career path", "soft skills",
                    "conflict resolution", "team dynamic", "collaborative environment", "work ethic",
                    "handling pressure", "difficult client", "failure", "success", "mistake",
                    "high pressure", "under stress", "challenging situation", "difficult colleague"
                ],
                "technical_keywords": [
                    "leadership", "teamwork", "communication", "negotiation", "problem solving",
                    "adaptability", "resilience", "initiative", "integrity", "accountability",
                    "benchmarks", "kpi", "okr", "performance review", "feedback loop",
                    "company vision", "stakeholders", "clients", "customers", "requirements",
                    "deadlines", "productivity", "management", "strategy", "roadmap",
                    "salary", "benefits", "compensation", "perks", "relocation", "remote work",
                    "working hours", "vacation", "insurance", "onboarding", "training",
                    "mentorship", "diversity", "inclusion", "equity", "belonging",
                    "ethics", "compliance", "policy", "regulations", "process",
                    "stress", "stressful", "stressing", "pressure", "pressured", "conflict", "conflicts", 
                    "fail", "failure", "failed", "failing", "weakness", "weaknesses", "strength", "strengths",
                    "tough", "overcome", "adversity", "challenge", "challenges", "challenging",
                    "goal", "goals", "aspirations", "ambition"
                ]
            }
        },
        "bias_rules": {
            "Gender & Family": [
                {"pattern": "pregnant|pregnancy|maternity|expecting|paternity|baby", "weight": 1.0, "explanation": "Direct inquiry into reproductive status is discriminatory."},
                {"pattern": "children|kids|child|family status|offspring|parental", "weight": 0.9, "explanation": "Questions about children often lead to caregivers bias."},
                {"pattern": "marital status|married|spouse|husband|wife|single|maiden", "weight": 0.9, "explanation": "Marital status is a protected category."},
                {"pattern": "childcare|babysitter|daycare|nanny", "weight": 0.8, "explanation": "Inquiring about personal care arrangements is biased."},
                {"pattern": "family commitments|family obligations", "weight": 0.8, "explanation": "Indirectly targets parents or caregivers."}
            ],
            "Age": [
                {"pattern": "digital native|tech savvy|energetic|fresh|vibrant|dynamic", "weight": 0.8, "explanation": "Favoring younger candidates via 'culture' terms."},
                {"pattern": "graduate|graduated|finish school|college years|high school", "weight": 0.7, "explanation": "Calculating age via dates is a surrogate for ageism."},
                {"pattern": "overqualified|too much experience|senior status|long tooth", "weight": 0.8, "explanation": "Coded language used to reject older workers."},
                {"pattern": "retirement|pension|golden years|old school", "weight": 0.9, "explanation": "Directly references age-related milestones."},
                {"pattern": "\\b\\d{2}\\b years? old|younger|older", "weight": 1.0, "explanation": "Direct age-based inquiry."}
            ],
            "Cultural & Origin": [
                {"pattern": "where are you from|originally from|heritage|background|roots", "weight": 1.0, "explanation": "National origin is a protected class."},
                {"pattern": "accent|speak like|native speaker|broken english", "weight": 0.9, "explanation": "Bias based on linguistic characteristics."},
                {"pattern": "passport|citizen|visa|h1b|green card|right to work", "weight": 0.8, "explanation": "Verify eligibility only; don't probe origin."},
                {"pattern": "your name.*unique|exotic|foreign|where.*name", "weight": 0.7, "explanation": "Microaggressions regarding perceived origin."},
                {"pattern": "lifestyle|vibe|social fit|culture fit", "weight": 0.8, "explanation": "Terms like 'lifestyle' or 'vibe' are often surrogates for discriminatory bias."}
            ],
            "Religion & Belief": [
                {"pattern": "religion|religious|church|mosque|temple|belief", "weight": 1.0, "explanation": "Direct inquiry into religious affiliation."},
                {"pattern": "christmas|ramadan|diwali|holiday|holy day|sunday off", "weight": 0.9, "explanation": "Inquiring about religious observances is discriminatory."},
                {"pattern": "spiritual|value system|moral compass", "weight": 0.7, "explanation": "Can be proxies for religious bias."}
            ]
        },
        "suggestions": {
            "Gender & Family": ["What is your professional availability?", "How do you handle team dependencies?"],
            "Age": ["Discuss your experience with high-scale systems.", "How do you mentor junior developers?"],
            "Cultural": ["What is your communication style for global teams?", "How do you handle diverse viewpoints?"],
            "Irrelevant": ["Let's focus on the technical requirements.", "Can you explain your CI/CD workflow?"]
        },
        "mock_sessions": mock_sessions
    }

    output_path = os.path.join(os.path.dirname(__file__), 'dat.json')
    with open(output_path, 'w', encoding='utf-8') as f:
        json.dump(data, f, indent=4)
    
    print(f"Generated {len(mock_sessions)} mock challenges and 1000+ patterns in dat.json")

if __name__ == "__main__":
    generate_huge_dataset()
