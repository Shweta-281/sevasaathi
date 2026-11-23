import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Calendar, Clock, Trash2, CheckCircle2, CalendarPlus } from 'lucide-react';
import { toast } from 'sonner';
import api from '../../lib/api.js';
import { Card, Button, Spinner, EmptyState } from '../../components/ui/index.jsx';
import { Field, Input, Select, Textarea } from '../../components/ui/Field.jsx';
import { formatDate } from '../../lib/constants.js';

export default function Appointments() {
  const [searchParams, setSearchParams] = useSearchParams();
  const rescheduleId = searchParams.get('reschedule') || '';
  const [appointments, setAppointments] = useState([]);
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Booking state
  const [serviceId, setServiceId] = useState('');
  const [date, setDate] = useState('');
  const [availability, setAvailability] = useState(null);
  const [selectedSlot, setSelectedSlot] = useState('');
  const [booking, setBooking] = useState(false);
  const [notes, setNotes] = useState('');

  const loadAppointments = () => {
    api.get('/appointments/mine')
      .then((r) => setAppointments(r.data))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadAppointments();
    api.get('/services').then((r) => setServices(r.data));
  }, []);

  useEffect(() => {
    if (!rescheduleId || !appointments.length) return;
    const appointment = appointments.find((item) => item.id === rescheduleId);
    if (!appointment) return;
    setServiceId(appointment.serviceId);
    setDate(appointment.date);
    setNotes(appointment.notes || '');
  }, [rescheduleId, appointments]);

  // Fetch availability when date changes
  useEffect(() => {
    if (!date) { setAvailability(null); return; }
    api.get(`/appointments/availability?date=${date}`)
      .then((r) => {
        const current = appointments.find((appointment) => appointment.id === rescheduleId);
        const result = r.data;
        if (current?.date === date) result.slots = result.slots.map((slot) => slot.slot === current.slot ? { ...slot, available: true } : slot);
        setAvailability(result);
      })
      .catch(() => toast.error('Failed to load slots'));
  }, [date, rescheduleId, appointments]);

  const handleBook = async (e) => {
    e.preventDefault();
    if (!serviceId || !date || !selectedSlot) {
      toast.error('Please select a service, date, and slot');
      return;
    }
    setBooking(true);
    try {
      const payload = { serviceId, date, slot: selectedSlot, notes: notes.trim() || undefined };
      if (rescheduleId) await api.patch(`/appointments/${rescheduleId}`, payload);
      else await api.post('/appointments', payload);
      toast.success(rescheduleId ? 'Appointment rescheduled' : 'Appointment booked successfully!');
      setSelectedSlot('');
      setNotes('');
      setSearchParams({});
      setDate('');
      setServiceId('');
      loadAppointments();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Booking failed');
    } finally {
      setBooking(false);
    }
  };

  const addToCalendar = (appointment) => {
    const startTime = appointment.slot.split('-')[0].replace(':', '') + '00';
    const endTime = appointment.slot.split('-')[1].replace(':', '') + '00';
    const datePart = appointment.date.replaceAll('-', '');
    const escape = (value = '') => String(value).replaceAll('\\', '\\\\').replaceAll(',', '\\,').replaceAll(';', '\\;').replaceAll('\n', '\\n');
    const content = ['BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//SevaSaathi//Appointments//EN', 'BEGIN:VEVENT', `UID:${appointment.id}@sevasaathi`, `DTSTAMP:${new Date().toISOString().replaceAll('-', '').replaceAll(':', '').replace(/\.\d{3}/, '')}`, `DTSTART;TZID=Asia/Kolkata:${datePart}T${startTime}`, `DTEND;TZID=Asia/Kolkata:${datePart}T${endTime}`, `SUMMARY:${escape(`SevaSaathi: ${appointment.service?.name || 'Appointment'}`)}`, `DESCRIPTION:${escape(appointment.notes || 'Please arrive a few minutes early.')}`, 'END:VEVENT', 'END:VCALENDAR'].join('\r\n');
    const url = URL.createObjectURL(new Blob([content], { type: 'text/calendar;charset=utf-8' }));
    const link = document.createElement('a'); link.href = url; link.download = `sevasaathi-${appointment.date}.ics`; link.click(); URL.revokeObjectURL(url);
  };

  const handleCancel = async (id) => {
    if (!window.confirm('Are you sure you want to cancel this appointment?')) return;
    try {
      await api.delete(`/appointments/${id}`);
      toast.success('Appointment cancelled');
      loadAppointments();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Could not cancel');
    }
  };

  // Minimum date is today
  const now = new Date();
  const today = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;

  return (
    <div>
      <h1 className="text-2xl font-bold text-ink-900">Appointments</h1>
      <p className="mt-1 text-sm text-ink-500">Book a time slot to visit the center, or manage your existing appointments.</p>

      <div className="mt-6 grid lg:grid-cols-3 gap-6">
        
        {/* Booking Form */}
        <Card className="lg:col-span-1 p-6 h-fit">
          <h2 className="font-semibold text-ink-900">{rescheduleId ? 'Reschedule appointment' : 'Book a slot'}</h2>
          <form onSubmit={handleBook} className="mt-4 space-y-4">
            <Field label="Service">
              <Select value={serviceId} onChange={(e) => setServiceId(e.target.value)} required>
                <option value="">Select a service…</option>
                {services.map((s) => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </Select>
            </Field>
            
            <Field label="Date">
              <Input type="date" min={today} value={date} onChange={(e) => setDate(e.target.value)} required />
            </Field>

            <Field label="Visit notes" hint="Optional details for your appointment (up to 500 characters).">
              <Textarea value={notes} maxLength={500} onChange={(e) => setNotes(e.target.value)} placeholder="Anything the service team should know?" />
            </Field>

            {availability && (
              <div>
                <label className="label-base">Available Slots</label>
                {availability.slots.every((s) => !s.available) ? (
                  <p className="text-sm text-rose-600">No slots available for this date.</p>
                ) : (
                  <div className="grid grid-cols-2 gap-2 mt-2">
                    {availability.slots.map((s) => (
                      <button
                        key={s.slot}
                        type="button"
                        disabled={!s.available}
                        onClick={() => setSelectedSlot(s.slot)}
                        className={`text-xs py-2 rounded-lg border font-medium transition ${
                          selectedSlot === s.slot 
                            ? 'bg-brand-600 text-white border-brand-600' 
                            : s.available 
                              ? 'bg-white text-ink-700 border-ink-200 hover:bg-ink-50' 
                              : 'bg-ink-100 text-ink-400 border-transparent cursor-not-allowed'
                        }`}
                      >
                        {s.slot}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}

            <Button type="submit" loading={booking} className="w-full" disabled={!selectedSlot}>
              {rescheduleId ? 'Save new time' : 'Confirm Booking'}
            </Button>
          </form>
        </Card>

        {/* Existing Appointments */}
        <Card className="lg:col-span-2 overflow-hidden h-fit">
          <div className="p-6 border-b border-ink-100">
            <h2 className="font-semibold text-ink-900">My Appointments</h2>
          </div>
          
          {loading ? (
            <div className="p-12 grid place-items-center"><Spinner className="h-6 w-6" /></div>
          ) : appointments.length === 0 ? (
            <EmptyState icon={Calendar} title="No appointments" description="You haven't booked any appointments yet." />
          ) : (
            <div className="divide-y divide-ink-100">
              {[...appointments].sort((a, b) => a.date.localeCompare(b.date) || a.slot.localeCompare(b.slot)).map((a) => (
                <div key={a.id} className="p-6 flex items-start justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ring-1 ring-inset ${
                        a.status === 'BOOKED' ? 'bg-emerald-50 text-emerald-700 ring-emerald-200' : 'bg-ink-100 text-ink-500 ring-ink-200'
                      }`}>
                        {a.status}
                      </span>
                      <span className="text-xs font-mono text-ink-500">{formatDate(a.date)}</span>
                    </div>
                    <h3 className="font-medium text-ink-900">{a.service?.name || 'Service'}</h3>
                    <div className="mt-2 flex items-center gap-4 text-xs text-ink-600">
                      <span className="inline-flex items-center gap-1"><Clock className="h-3.5 w-3.5" /> {a.slot}</span>
                    </div>
                    {a.notes && <p className="mt-2 max-w-lg text-xs text-ink-500">{a.notes}</p>}
                  </div>
                  <div className="flex shrink-0 items-center gap-1">{a.status === 'BOOKED' && <Button variant="ghost" size="sm" onClick={() => addToCalendar(a)} aria-label="Add to calendar"><CalendarPlus className="h-4 w-4" /></Button>}{a.status === 'BOOKED' && <Button variant="secondary" size="sm" onClick={() => { setSearchParams({ reschedule: a.id }); setSelectedSlot(''); }}>Reschedule</Button>}{a.status === 'BOOKED' && <Button variant="ghost" size="sm" onClick={() => handleCancel(a.id)} aria-label="Cancel appointment" className="text-rose-600 hover:text-rose-700 hover:bg-rose-50"><Trash2 className="h-4 w-4" /></Button>}</div>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
