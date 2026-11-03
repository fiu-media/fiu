import { Body, Button, Container, Head, Heading, Html, Img, Link, Preview, Text } from "@react-email/components";

/** A row with an `href` renders its value as a link. */
export type Row = [label: string, value: string, href?: string];
export type KitLine = { name: string; brand?: string | null; qty: number };

export const kitLineLabel = ({ name, brand, qty }: KitLine) => `${qty} × ${brand ? `${brand} ` : ""}${name}`;

/** Rows without a value are left out. */
export const present = (rows: Row[]) => rows.filter(([, value]) => value.trim() !== "");

/** An empty value has nothing to link to, so it gets no href (and `present` drops the row anyway). */
export const mailto = (email: string): string | undefined => (email.trim() ? `mailto:${email.trim()}` : undefined);

/** Dialling needs only the digits and a leading +, not the spaces and brackets people type. */
export const tel = (phone: string): string | undefined => {
  const number = phone.trim().replace(/(?!^\+)\D/g, "");
  return number ? `tel:${number}` : undefined;
};

/*
 * The site's light surface (globals.css), as plain hex: email clients don't read custom properties or light-dark().
 * No web fonts: the site self-hosts its fonts, and loading them from Google would tell Google who opened the email.
 * Headings fall back to Georgia, the closest serif to Fraunces that every client has.
 */
const colors = { paper: "#f4f1ec", raised: "#ffffff", fg: "#151316", muted: "#5f5a63", line: "#e3e2e3", edge: "#d9d6d2" };
const text = 'Manrope,system-ui,-apple-system,"Segoe UI",sans-serif';
const display = 'Fraunces,Georgia,"Times New Roman",serif';

/** The site's eyebrow: small spaced capitals. */
const eyebrow = {
  fontSize: 12,
  fontWeight: 600,
  letterSpacing: "0.14em",
  textTransform: "uppercase",
  color: colors.muted,
} as const;

type LayoutProps = {
  heading: string;
  rows: Row[];
  /** The site's origin, for the logo and its link home. */
  siteUrl: string;
  intro?: string;
  kit?: KitLine[];
  kitLabel?: string;
  link?: [label: string, href: string];
  /** Closes an email to a visitor, in the display face. */
  signoff?: string;
};

/** Shared shell for the three emails: the site's colours and type, on one white card. Values go in as JSX children, so React escapes them. */
export function Layout({ heading, rows, siteUrl, intro, kit, kitLabel, link, signoff }: LayoutProps) {
  return (
    <Html>
      <Head>
        {/* Light only: a client that inverts the colours itself would leave the dark logo on a dark card. */}
        <meta name="color-scheme" content="light only" />
        <meta name="supported-color-schemes" content="light only" />
      </Head>
      <Preview>{heading}</Preview>
      <Body
        style={{
          margin: 0,
          padding: "32px 16px",
          background: colors.paper,
          fontFamily: text,
          fontSize: 15,
          lineHeight: 1.5,
          color: colors.fg,
        }}
      >
        <Container
          style={{
            maxWidth: 560,
            margin: "0 auto",
            padding: 32,
            background: colors.raised,
            border: `1px solid ${colors.edge}`,
            borderRadius: 24,
          }}
        >
          <Link href={siteUrl} className="logo">
            <Img src={`${siteUrl}/brand/fiu-avatar.png`} width={44} height={44} alt="Fiú Media" style={{ borderRadius: 12 }} />
          </Link>
          <Heading
            as="h1"
            style={{
              fontFamily: display,
              fontSize: 28,
              fontWeight: 400,
              letterSpacing: "-0.02em",
              lineHeight: 1.15,
              margin: "24px 0 16px",
            }}
          >
            {heading}
          </Heading>
          {intro ? <Text style={{ fontSize: 15, margin: "0 0 20px" }}>{intro}</Text> : null}
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <tbody>
              {rows.map(([label, value, href]) => (
                <tr key={label}>
                  <td
                    style={{
                      padding: "10px 16px 10px 0",
                      borderTop: `1px solid ${colors.line}`,
                      color: colors.muted,
                      verticalAlign: "top",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {label}
                  </td>
                  <td style={{ padding: "10px 0", borderTop: `1px solid ${colors.line}`, whiteSpace: "pre-wrap" }}>
                    {href ? (
                      <Link href={href} style={{ color: "inherit", textDecoration: "underline" }}>
                        {value}
                      </Link>
                    ) : (
                      value
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {kit?.length ? (
            <>
              <Heading as="h2" style={{ ...eyebrow, margin: "28px 0 8px" }}>
                {kitLabel}
              </Heading>
              <ul style={{ margin: 0, paddingLeft: 20 }}>
                {kit.map((line, i) => (
                  <li key={i} style={{ margin: "2px 0" }}>
                    {kitLineLabel(line)}
                  </li>
                ))}
              </ul>
            </>
          ) : null}
          {link ? (
            // The site's buttons are clear glass, which email can't draw; a solid ink pill is the nearest.
            <Button
              href={link[1]}
              style={{
                display: "inline-block",
                marginTop: 28,
                padding: "12px 22px",
                borderRadius: 9999,
                background: colors.fg,
                color: colors.raised,
                fontSize: 15,
                fontWeight: 600,
                textDecoration: "none",
              }}
            >
              {link[0]}
            </Button>
          ) : null}
          {signoff ? (
            <Text style={{ fontFamily: display, fontSize: 18, fontStyle: "italic", margin: "28px 0 0" }}>{signoff}</Text>
          ) : null}
        </Container>
      </Body>
    </Html>
  );
}
