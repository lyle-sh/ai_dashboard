'use client';

import { useSession, signIn, signOut } from 'next-auth/react';
import { useEffect, useState } from 'react';

export default function CalendarEvents() {
  const { data: session } = useSession();
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!session?.accessToken) return;
    const fetchEvents = async () => {
      setLoading(true);
      try {
        const res = await fetch('/api/calendar', {
          headers: { 'Authorization': `Bearer ${(session as any).accessToken}` }
        });
        const data = await res.json();
        setEvents(data.events || []);
      } catch (err) {
        console.error('Failed to fetch events:', err);
      }
      setLoading(false);
    };
    fetchEvents();
  }, [session]);

  if (!session) return null;
  if (loading) return <div style={{padding:'8px 0',fontSize:13,color:'var(--text3)'}}>Loading events...</div>;
  if (events.length === 0) return <div style={{padding:'8px 0',fontSize:13,color:'var(--text3)'}}>No upcoming events from Google.</div>;

  return (
    <div style={{marginTop:10,display:'flex',flexDirection:'column',gap:6}}>
      {events.map((event: any) => (
        <div key={event.id} style={{padding:'8px 10px',background:'var(--bg3)',borderRadius:8,fontSize:13}}>
          <div style={{fontWeight:600}}>{event.summary}</div>
          <div style={{fontSize:11,color:'var(--text2)',marginTop:2}}>
            {event.start?.dateTime
              ? new Date(event.start.dateTime).toLocaleString([],{dateStyle:'medium',timeStyle:'short'})
              : 'All Day'}
          </div>
        </div>
      ))}
    </div>
  );
}
