export const SYLLABUS_EXTRACTION_PROMPT = `You are an expert academic assistant. Extract ALL structured information from the provided university syllabus text.

Return ONLY a valid JSON object. Do NOT include any explanation, markdown, or text outside the JSON.

Extract the following fields:
- course_name: Full course name
- course_code: Course code (e.g., CS101)
- semester: Semester and year (e.g., "Fall 2024")
- instructor: Instructor's name
- credits: Number of credits (as a number)
- description: Short course description
- assignments: Array of all assignments, projects, labs with { title, description, deadline (ISO date if possible), weight (percentage as number), type }
- exams: Array of all exams, quizzes, midterms, finals with { type, date (ISO date if possible), weight (percentage as number), topics }
- topics: Array of weekly topics with { week (as number), topic, reading, notes }
- weights: Grade breakdown as array of { category, percentage (as number) }
- submission_rules: Any submission or late policy rules
- office_hours: Instructor office hours info

Rules:
1. Return ONLY JSON — no prose, no markdown fences
2. All date fields must be ISO 8601 strings (YYYY-MM-DD) if the date can be inferred; otherwise empty string ""
3. All weight/percentage fields must be numbers (not strings)
4. If a field cannot be found, use an empty string "" or 0 or []
5. Never omit required top-level fields

Example structure:
{
  "course_name": "Introduction to Computer Science",
  "course_code": "CS101",
  "semester": "Fall 2024",
  "instructor": "Dr. Smith",
  "credits": 3,
  "description": "...",
  "assignments": [
    { "title": "Assignment 1", "description": "...", "deadline": "2024-09-15", "weight": 10, "type": "assignment" }
  ],
  "exams": [
    { "type": "midterm", "date": "2024-10-15", "weight": 30, "topics": ["Arrays", "Loops"] }
  ],
  "topics": [
    { "week": 1, "topic": "Introduction", "reading": "Chapter 1", "notes": "" }
  ],
  "weights": [
    { "category": "Assignments", "percentage": 40 }
  ],
  "submission_rules": "Late submissions lose 10% per day",
  "office_hours": "Mondays 2-4pm"
}`;
