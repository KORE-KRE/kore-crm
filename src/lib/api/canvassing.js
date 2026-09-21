import { supabase } from "../supabaseClient.js";

// x/y map-scatter coordinates were purely decorative in the prototype
// (deterministic pseudo-random, no real geo meaning) — regenerate the same
// way client-side from a hash of the record id instead of persisting them.
export function hashToXY(id) {
  let h = 0;
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) >>> 0;
  return { x: 8 + (h % 84), y: 12 + ((h >> 8) % 76) };
}

function rowToRecord(r) {
  const { x, y } = hashToXY(r.id);
  return {
    id: r.id,
    address: r.address || "",
    erfRef: r.erf_ref || "",
    erfSizeSqm: r.erf_size_sqm || "",
    trxDate: r.trx_date || "",
    sellPrice: Number(r.sell_price) || 0,
    marketingLink: r.marketing_link || "",
    suburb: r.suburb || "",
    x, y,
    ownerName: r.owner_name || "",
    knownName: r.known_name || "",
    idNumber: r.id_number || "",
    age: r.age || "",
    ownerPhone: r.owner_phone || "",
    emailContactDetails: r.email || "",
    broker: r.broker_id,
    agent: r.broker_id,
    date: new Date(r.created_at),
    status: r.status,
    archived: r.archived,
    noInfoObtained: r.no_info_obtained,
    numberRequestTodoId: r.number_request_todo_id,
    followUpDate: r.follow_up_date || "",
    notes: (r.canvassing_notes || [])
      .slice()
      .sort((a, b) => new Date(a.created_at) - new Date(b.created_at))
      .map((n) => ({ id: n.id, text: n.text, type: n.type, author: n.author_id, timestamp: new Date(n.created_at) })),
    valuation: (r.canvassing_valuations || [])[0]
      ? {
          id: r.canvassing_valuations[0].id,
          date: r.canvassing_valuations[0].date,
          agent: r.canvassing_valuations[0].agent_id,
          price: Number(r.canvassing_valuations[0].price) || 0,
          pdfPath: r.canvassing_valuations[0].pdf_path || "",
        }
      : null,
  };
}

const SELECT = "*, canvassing_notes(*), canvassing_valuations(*)";

export async function fetchCanvassingRecords() {
  const { data, error } = await supabase.from("canvassing_records").select(SELECT).order("created_at", { ascending: false });
  if (error) throw error;
  return data.map(rowToRecord);
}

export async function addRecord(record) {
  const { data, error } = await supabase
    .from("canvassing_records")
    .insert({
      address: record.address, erf_ref: record.erfRef, erf_size_sqm: record.erfSizeSqm || null,
      sell_price: record.sellPrice || null, marketing_link: record.marketingLink, suburb: record.suburb,
      owner_name: record.ownerName, known_name: record.knownName, owner_phone: record.ownerPhone,
      email: record.emailContactDetails, broker_id: record.broker, status: record.status || "Uncontacted",
      follow_up_date: record.followUpDate || null,
    })
    .select(SELECT)
    .single();
  if (error) throw error;
  return rowToRecord(data);
}

export async function bulkInsertRecords(records) {
  const rows = records.map((record) => ({
    address: record.address, erf_ref: record.erfRef, sell_price: record.sellPrice || null,
    marketing_link: record.marketingLink, suburb: record.suburb, owner_name: record.ownerName,
    owner_phone: record.ownerPhone, email: record.emailContactDetails, broker_id: record.broker,
    status: record.status || "Uncontacted",
  }));
  const { error } = await supabase.from("canvassing_records").insert(rows);
  if (error) throw error;
}

export async function updateRecord(id, patch) {
  const { data, error } = await supabase.from("canvassing_records").update(patch).eq("id", id).select(SELECT).single();
  if (error) throw error;
  return rowToRecord(data);
}

export async function fetchRecordById(id) {
  const { data, error } = await supabase.from("canvassing_records").select(SELECT).eq("id", id).single();
  if (error) throw error;
  return rowToRecord(data);
}

export async function addNote(recordId, { text, type, authorId }) {
  const { error } = await supabase.from("canvassing_notes").insert({ record_id: recordId, text, type, author_id: authorId });
  if (error) throw error;
  return fetchRecordById(recordId);
}

export async function saveValuation(recordId, { date, agentId, price }, pdfFile) {
  let pdfPath = "";
  if (pdfFile) {
    pdfPath = `canvassing/${recordId}/${crypto.randomUUID()}.pdf`;
    const { error: uploadError } = await supabase.storage.from("canvassing-valuations").upload(pdfPath, pdfFile, { upsert: true });
    if (uploadError) throw uploadError;
  }
  const { error } = await supabase
    .from("canvassing_valuations")
    .insert({ canvassing_record_id: recordId, date, agent_id: agentId, price, pdf_path: pdfPath || null });
  if (error) throw error;
  return fetchRecordById(recordId);
}

export async function getValuationSignedUrl(pdfPath) {
  const { data, error } = await supabase.storage.from("canvassing-valuations").createSignedUrl(pdfPath, 3600);
  if (error) throw error;
  return data.signedUrl;
}
