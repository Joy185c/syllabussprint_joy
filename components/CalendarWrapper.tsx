'use client';

import { useState } from 'react';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import listPlugin from '@fullcalendar/list';
import interactionPlugin from '@fullcalendar/interaction';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Calendar, BookOpen, AlignLeft } from 'lucide-react';

export default function CalendarWrapper({ events }: { events: any[] }) {
  const [selectedEvent, setSelectedEvent] = useState<any>(null);

  return (
    <>
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
          setSelectedEvent({
            title: info.event.title,
            course: info.event.extendedProps.course,
            type: info.event.extendedProps.type,
            description: info.event.extendedProps.description,
            date: info.event.startStr,
            color: info.event.backgroundColor,
          });
        }}
      />

      <AnimatePresence>
        {selectedEvent && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              transition={{ duration: 0.2, ease: "easeOut" }}
              className="relative w-full max-w-md overflow-hidden bg-[#0f172a]/90 border border-white/10 rounded-2xl shadow-2xl backdrop-blur-xl"
            >
              {/* Header with dynamic color line */}
              <div 
                className="h-2 w-full" 
                style={{ backgroundColor: selectedEvent.color || '#4f46e5' }} 
              />
              
              <div className="p-6">
                <button
                  onClick={() => setSelectedEvent(null)}
                  className="absolute top-6 right-6 p-1.5 text-slate-400 hover:text-white hover:bg-white/10 rounded-full transition-colors"
                >
                  <X size={20} />
                </button>

                <div className="mb-6 pr-8">
                  <div className="inline-flex items-center px-2.5 py-1 mb-3 text-xs font-semibold uppercase tracking-wider rounded-full" 
                       style={{ 
                         backgroundColor: `${selectedEvent.color}20`, 
                         color: selectedEvent.color 
                       }}>
                    {selectedEvent.type || 'Event'}
                  </div>
                  <h2 className="text-2xl font-bold text-white leading-tight">
                    {selectedEvent.title}
                  </h2>
                </div>

                <div className="space-y-4">
                  {selectedEvent.course && (
                    <div className="flex items-start gap-3 text-slate-300">
                      <BookOpen size={18} className="mt-0.5 text-slate-400" />
                      <div>
                        <p className="text-[10px] text-slate-500 uppercase tracking-wider font-semibold mb-0.5">Course</p>
                        <p className="font-medium text-slate-200">{selectedEvent.course}</p>
                      </div>
                    </div>
                  )}

                  {selectedEvent.date && (
                    <div className="flex items-start gap-3 text-slate-300">
                      <Calendar size={18} className="mt-0.5 text-slate-400" />
                      <div>
                        <p className="text-[10px] text-slate-500 uppercase tracking-wider font-semibold mb-0.5">Date</p>
                        <p className="font-medium text-slate-200">
                          {new Date(selectedEvent.date).toLocaleDateString('en-US', {
                            weekday: 'long',
                            month: 'long',
                            day: 'numeric'
                          })}
                        </p>
                      </div>
                    </div>
                  )}

                  {selectedEvent.description && (
                    <div className="flex items-start gap-3 text-slate-300">
                      <AlignLeft size={18} className="mt-0.5 text-slate-400" />
                      <div>
                        <p className="text-[10px] text-slate-500 uppercase tracking-wider font-semibold mb-0.5">Details</p>
                        <p className="text-sm text-slate-300 leading-relaxed">{selectedEvent.description}</p>
                      </div>
                    </div>
                  )}
                </div>

                <div className="mt-8">
                  <button 
                    onClick={() => setSelectedEvent(null)}
                    className="w-full py-2.5 px-4 bg-white/5 hover:bg-white/10 text-white font-medium rounded-xl border border-white/10 transition-all active:scale-[0.98]"
                  >
                    Close
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}
