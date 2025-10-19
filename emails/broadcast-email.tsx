import {
  Html,
  Head,
  Body,
  Container,
  Text,
  Preview,
  Img,
  Hr,
  Heading,
} from "@react-email/components";

interface BroadcastProps {
  title: string;
  content: string;
  previewText: string;
}

const BroadcastEmail = ({ title, content, previewText }: BroadcastProps) => (
  <Html>
    <Head />
    <Preview>{previewText}</Preview>
    <Body
      style={{
        fontFamily: "sans-serif",
        padding: "32px 16px",
      }}
    >
      <Container
        style={{
          margin: "0 auto",
          maxWidth: "576px",
          borderRadius: "8px",
          border: "1px solid #27272a",
          backgroundColor: "#09090b",
          padding: "32px",
        }}
      >
        <Img
          src="https://www.luminixstudio.online/logo.jpg"
          alt="Luminix-logo"
          width="48"
          height="48"
          style={{ marginBottom: "24px" }}
        />

        <Heading
          style={{
            margin: "0 0 16px 0",
            fontSize: "24px",
            fontWeight: "600",
            color: "#ffffff",
          }}
        >
          {title}
        </Heading>

        <Hr style={{ margin: "24px 0", borderColor: "#27272a" }} />

        <div
          style={{
            marginBottom: "24px",
            fontSize: "16px",
            lineHeight: "1.625",
            color: "#a1a1aa",
          }}
          dangerouslySetInnerHTML={{ __html: content }}
        />

        <Hr style={{ margin: "24px 0", borderColor: "#27272a" }} />

        <Text
          style={{
            margin: "0 0 8px 0",
            fontSize: "14px",
            color: "#71717a",
          }}
        >
          Thank you for subscribing to our newsletter.
        </Text>

        <Text
          style={{
            margin: "0",
            fontSize: "12px",
            color: "#52525b",
          }}
        >
          If you wish to unsubscribe, you can do so at any time.
        </Text>
      </Container>
    </Body>
  </Html>
);

export default BroadcastEmail;
