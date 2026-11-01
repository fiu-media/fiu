import { Body, Container, Head, Heading, Html, Link, Preview, Text } from "@react-email/components";

export type Row = [label: string, value: string];
export type KitLine = { name: string; brand?: string | null; qty: number };

export const kitLineLabel = ({ name, brand, qty }: KitLine) => `${qty} × ${brand ? `${brand} ` : ""}${name}`;

/** Rows without a value are left out. */
export const present = (rows: Row[]) => rows.filter(([, value]) => value.trim() !== "");

const font = "system-ui,-apple-system,Segoe UI,sans-serif";

type LayoutProps = {
  heading: string;
  rows: Row[];
  intro?: string;
  kit?: KitLine[];
  kitLabel?: string;
  link?: [label: string, href: string];
};

/** Shared shell for the three emails. Values go in as JSX children, so React escapes them. */
export function Layout({ heading, rows, intro, kit, kitLabel, link }: LayoutProps) {
  return (
    <Html>
      <Head />
      <Preview>{heading}</Preview>
      <Body style={{ margin: 0, fontFamily: font, fontSize: 15, lineHeight: 1.5, color: "#151316" }}>
        <Container style={{ maxWidth: 560, margin: 0 }}>
          <Heading as="h1" style={{ fontSize: 20, margin: "0 0 16px" }}>
            {heading}
          </Heading>
          {intro ? <Text style={{ margin: "0 0 16px" }}>{intro}</Text> : null}
          <table style={{ borderCollapse: "collapse" }}>
            <tbody>
              {rows.map(([label, value]) => (
                <tr key={label}>
                  <td style={{ padding: "6px 16px 6px 0", color: "#6b6670", verticalAlign: "top" }}>{label}</td>
                  <td style={{ padding: "6px 0", whiteSpace: "pre-wrap" }}>{value}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {kit?.length ? (
            <>
              <Heading as="h2" style={{ fontSize: 15, margin: "20px 0 6px" }}>
                {kitLabel}
              </Heading>
              <ul style={{ margin: 0, paddingLeft: 20 }}>
                {kit.map((line, i) => (
                  <li key={i}>{kitLineLabel(line)}</li>
                ))}
              </ul>
            </>
          ) : null}
          {link ? (
            <Text style={{ margin: "24px 0 0" }}>
              <Link href={link[1]}>{link[0]}</Link>
            </Text>
          ) : null}
        </Container>
      </Body>
    </Html>
  );
}
