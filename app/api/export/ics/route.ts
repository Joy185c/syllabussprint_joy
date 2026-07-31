import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';

function formatIcsDate(dateString: string) {
  // Assuming dateString is "YYYY-MM-DD"
  return dateString.replace(/-/g, '');
}

function generateIcs(events: any[]) {
  const lines = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//SyllabusSprint//EN',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH'
  ];

  for (const event of events) {
    if (!event.date) continue; // Skip events without a date

    const dtStamp = new Date().toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
    const dtStart = formatIcsDate(event.date);
    // For all day events, DTEND is the next day. But simpler to just use DTSTART;VALUE=DATE
    // and no DTEND for a simple day event, or DTEND same as DTSTART + 1 day
    
    // Calculate DTEND for all day event (next day)
    const dateObj = new Date(event.date);
    dateObj.setDate(dateObj.getDate() + 1);
    const dtEnd = dateObj.toISOString().split('T')[0].replace(/-/g, '');

    lines.push('BEGIN:VEVENT');
    lines.push(`UID:${event.id || crypto.randomUUID()}`);
    lines.push(`DTSTAMP:${dtStamp}`);
    lines.push(`DTSTART;VALUE=DATE:${dtStart}`);
    lines.push(`DTEND;VALUE=DATE:${dtEnd}`);
    lines.push(`SUMMARY:${event.title}`);
    if (event.description || event.courseName) {
      let desc = '';
      if (event.courseName) desc += `Course: ${event.courseName}\\n`;
      if (event.description) desc += `${event.description}`;
      lines.push(`DESCRIPTION:${desc.replace(/\n/g, '\\n')}`);
    }
    lines.push('END:VEVENT');
  }

  lines.push('END:VCALENDAR');
  return lines.join('\r\n');
}

export async function GET(req: NextRequest) {
  const workspaceId = req.nextUrl.searchParams.get('workspace_id');
  if (!workspaceId) {
    return new NextResponse('workspace_id required', { status: 400 });
  }

  try {
    const supabase = createServerClient();

    // Fetch courses with assignments, exams, and timeline
    const { data: courses, error: coursesError } = await supabase
      .from('courses')
      .select(`
        id, title,
        assignments (id, title, deadline, description),
        exams (id, type, date),
        timeline (id, title, date, description, type)
      `)
      .eq('workspace_id', workspaceId);

    if (coursesError) throw coursesError;

    const allEvents: any[] = [];

    // Aggregate events
    courses?.forEach((course) => {
      course.assignments?.forEach((assignment: any) => {
        allEvents.push({
          id: assignment.id,
          title: `Assignment: ${assignment.title}`,
          date: assignment.deadline,
          description: assignment.description,
          courseName: course.title,
        });
      });

      course.exams?.forEach((exam: any) => {
        allEvents.push({
          id: exam.id,
          title: `Exam: ${exam.type.charAt(0).toUpperCase() + exam.type.slice(1)}`,
          date: exam.date,
          description: `Type: ${exam.type}`,
          courseName: course.title,
        });
      });
      
      course.timeline?.forEach((item: any) => {
        allEvents.push({
          id: item.id,
          title: item.title,
          date: item.date,
          description: item.description,
          courseName: item.type, // Store type as description
        });
      });
    });

    const icsContent = generateIcs(allEvents);

    return new NextResponse(icsContent, {
      status: 200,
      headers: {
        'Content-Type': 'text/calendar; charset=utf-8',
        'Content-Disposition': `attachment; filename="SyllabusSprint_Calendar.ics"`,
      },
    });
  } catch (err: any) {
    return new NextResponse(err.message, { status: 500 });
  }
}
