/** `text` with `placeholder` replaced by an external link, so a translation can put the link wherever its grammar wants it. */
export function WithLink({
  text,
  placeholder,
  href,
  label,
  newTab,
}: {
  text: string;
  placeholder: string;
  href: string;
  label: string;
  newTab: string;
}) {
  const [before, after = ""] = text.split(placeholder);
  return (
    <>
      {before}
      <a href={href} target="_blank" rel="noopener noreferrer" className="link-inline">
        {label}
        <span className="sr-only"> ({newTab})</span>
      </a>
      {after}
    </>
  );
}
