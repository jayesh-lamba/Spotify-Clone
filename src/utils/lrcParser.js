/**
 * parseLRC — parse LRC-formatted timestamped lyrics into an array
 * of { time: number (seconds), text: string } objects.
 *
 * LRC format lines look like:
 *   [mm:ss.xx] lyric text
 *   [01:23.45] Walking down the street tonight
 *
 * Returns { synced: true, lines: [{time, text}] }
 * or      { synced: false, lines: [{text}] }  when no timestamps found.
 */
export function parseLRC(rawLyrics) {
    if (!rawLyrics || typeof rawLyrics !== "string") {
        return { synced: false, lines: [] };
    }

    const raw = rawLyrics.trim();
    if (!raw) return { synced: false, lines: [] };

    // Detect LRC: at least one [mm:ss] or [mm:ss.xx] timestamp
    const timestampRe = /^\[(\d{1,3}):(\d{2})(?:[.:,](\d{1,3}))?\](.*)/;
    const metaTagRe   = /^\[(?:ti|ar|al|by|offset|length):.*\]/i;

    const lines   = [];
    let hasSynced = false;

    for (const rawLine of raw.split(/\r?\n/)) {
        const line = rawLine.trim();
        if (!line) continue;
        if (metaTagRe.test(line)) continue; // skip LRC metadata tags

        const m = line.match(timestampRe);
        if (m) {
            hasSynced = true;
            const mins = parseInt(m[1], 10);
            const secs = parseInt(m[2], 10);
            // m[3] is the fractional part (ms or cs)
            const frac = m[3] ? parseInt(m[3], 10) / Math.pow(10, m[3].length) : 0;
            const time = mins * 60 + secs + frac;
            const text = (m[4] || "").trim();
            if (text) lines.push({ time, text });
        } else {
            // Plain line — keep as unsynced
            lines.push({ text: line });
        }
    }

    if (hasSynced) {
        // Sort by time (some LRC files are out of order)
        const synced = lines.filter((l) => l.time !== undefined);
        synced.sort((a, b) => a.time - b.time);
        return { synced: true, lines: synced };
    }

    // No timestamps found — return as plain text lines
    return { synced: false, lines: lines.map((l) => ({ text: l.text || l })) };
}

/**
 * findActiveLine — binary search for the current lyric index
 * given the audio currentTime and an array of synced lines.
 *
 * Returns the index of the last line whose .time <= currentTime.
 */
export function findActiveLine(lines, currentTime) {
    if (!lines || lines.length === 0) return -1;
    let lo = 0;
    let hi = lines.length - 1;
    let result = -1;

    while (lo <= hi) {
        const mid = (lo + hi) >> 1;
        if (lines[mid].time <= currentTime) {
            result = mid;
            lo = mid + 1;
        } else {
            hi = mid - 1;
        }
    }
    return result;
}
