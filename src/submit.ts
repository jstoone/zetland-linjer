import { supabase } from "./supabase";
import type { Connection } from "./connections";

const SESSION_KEY = "linjer_session_id";
const SUBMITTED_KEY = "linjer_submitted";
const CONNECTIONS_KEY = "linjer_connections";

function getSessionId(): string {
  let id = localStorage.getItem(SESSION_KEY);
  if (!id) {
    id = crypto.randomUUID();
    localStorage.setItem(SESSION_KEY, id);
  }
  return id;
}

export function isSubmitted(): boolean {
  return localStorage.getItem(SUBMITTED_KEY) === "true";
}

/**
 * Submit connections to Supabase.
 * Box indices are 0-based internally — we store 1-based in the DB.
 */
export async function submitConnections(
  connections: Connection[],
): Promise<void> {
  const sessionId = getSessionId();

  const rows = connections.map((c) => ({
    session_id: sessionId,
    source_box: c.source + 1,
    target_box: c.target + 1,
  }));

  const { error } = await supabase.from("connections").insert(rows);

  if (error) {
    throw new Error(error.message);
  }

  // Mark as submitted in localStorage
  localStorage.setItem(SUBMITTED_KEY, "true");
  localStorage.setItem(CONNECTIONS_KEY, JSON.stringify(connections));
}
