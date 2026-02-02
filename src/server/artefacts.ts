/**
 * Artefacts (placeholder)
 *
 * MVP approach:
 * - store artefact blobs/files in `data/artefacts/`
 * - store artefact metadata in DB later (table not added yet)
 *
 * Next step: add an `artefacts` table with (id, threadId, kind, filename,
 * contentType, byteLength, sha256, createdAt) and a download route.
 */

export const ARTEFACTS_DIR = "data/artefacts";
