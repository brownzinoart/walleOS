#!/usr/bin/env python3
"""
Interactive CLI for Wally's Resume Agent
"""

from pathlib import Path
from agent import RecruiterAgent
import sys

def main():
    agent = RecruiterAgent()
    
    print("🎯 **Wally's Resume Agent**")
    print("I'll analyze your resume and provide specific improvement suggestions.\n")
    
    # Auto-set targets for Wally
    agent.set_targets(
        roles=["AI Implementation Lead", "UX Director", "Product Manager"],
        companies=["OpenAI", "Anthropic", "Google", "Microsoft"],
        sectors=["AI/ML", "SaaS", "Health Tech"]
    )
    print("✅ Targets set: AI Implementation Lead, UX Director, Product Manager\n")
    
    # Load Wally's resume from the 2025 markdown file
    try:
        project_root = Path(__file__).resolve().parents[1]
        resume_path = project_root / "public" / "WallyMo_Resume_2025.md"
        with resume_path.open("r", encoding="utf-8") as f:
            resume_text = f.read()
        print("📄 Resume loaded successfully\n")
    except FileNotFoundError:
        print(f"❌ Resume file not found. Please ensure '{resume_path}' exists.")
        return
    
    while True:
        print("\n**Available commands:**")
        print("1. analyze - Analyze resume and identify gaps")
        print("2. improve - Get specific improvement suggestions") 
        print("3. brief - Generate recruiter brief")
        print("4. synthesize - Create complete portfolio assets")
        print("5. quit - Exit session")
        
        choice = input("\nEnter choice (1-5): ").strip().lower()
        
        if choice in ['quit', 'q', '5']:
            print("👋 Good luck with your job search!")
            break
        elif choice in ['analyze', '1']:
            analysis = agent.analyze_resume(resume_text)
            print("\n📊 **Resume Analysis**")
            print(f"Candidate: {analysis['candidate']['name']}")
            print(f"Experiences found: {len(analysis['experiences'])}")
            print(f"Issues identified: {len(analysis['analysis']['missing_metrics']) + len(analysis['analysis']['suggestions'])}")
            
        elif choice in ['improve', '2']:
            suggestions = agent.suggest_improvements(resume_text)
            print(suggestions)
            
        elif choice in ['brief', '3']:
            brief = agent.generate_brief()
            print(brief)
            
        elif choice in ['synthesize', '4']:
            synthesis = agent.synthesize()
            print(synthesis)
            
        else:
            print("❌ Invalid choice. Please enter 1-5.")

if __name__ == "__main__":
    main()
