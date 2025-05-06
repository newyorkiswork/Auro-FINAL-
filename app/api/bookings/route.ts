import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);

export async function POST(req: Request) {
  const body = await req.json();
  const { user_id, laundromat_id, machine_id, start_time, end_time } = body;
  if (!user_id || !laundromat_id || !machine_id || !start_time || !end_time) {
    return NextResponse.json({ error: 'Missing required fields.' }, { status: 400 });
  }

  // Check if machine is available
  const { data: machine, error: machineError } = await supabase
    .from('machines')
    .select('status')
    .eq('id', machine_id)
    .single();
  if (machineError || !machine) {
    return NextResponse.json({ error: 'Machine not found.' }, { status: 404 });
  }
  if (machine.status !== 'available') {
    return NextResponse.json({ error: 'Machine is not available.' }, { status: 409 });
  }

  // Insert booking
  const { data: booking, error: bookingError } = await supabase
    .from('bookings')
    .insert({ user_id, laundromat_id, machine_id, start_time, end_time, status: 'active' })
    .select()
    .single();
  if (bookingError) {
    return NextResponse.json({ error: bookingError.message }, { status: 500 });
  }

  // Optionally update machine status to 'booked'
  await supabase.from('machines').update({ status: 'booked' }).eq('id', machine_id);

  return NextResponse.json({ booking });
} 