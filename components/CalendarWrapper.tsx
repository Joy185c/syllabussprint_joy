'use client';

import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import listPlugin from '@fullcalendar/list';
import interactionPlugin from '@fullcalendar/interaction';

export default function CalendarWrapper({ events }: { events: any[] }) {
  return (
    <FullCalendar
      plugins={[dayGridPlugin, timeGridPlugin, listPlugin, interactionPlugin] as any}
      initialView="dayGridMonth"
      headerToolbar={{
        left: 'prev,next today',
        center: 'title',
        right: 'dayGridMonth,timeGridWeek,listWeek'
      }}
      events={events}
      height="auto"
      eventClick={(info) => {
        alert(`${info.event.title}\nCourse: ${info.event.extendedProps.course}\nType: ${info.event.extendedProps.type}`);
      }}
    />
  );
}
