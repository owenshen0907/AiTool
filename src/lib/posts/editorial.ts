// An editorial scope check, not a security or privacy classifier.
const COMPANY_REFERENCE = /evox|evomap|\bEFX\b/i;

export function isPersonalContent(
  raw: string,
  frontmatter: { draft?: unknown; visibility?: unknown },
) {
  return (
    frontmatter.draft !== true &&
    frontmatter.visibility !== 'private' &&
    !COMPANY_REFERENCE.test(raw)
  );
}
