import {
  Html,
  Head,
  Preview,
  Tailwind,
  Container,
  Section,
  Heading,
  Text,
  Hr,
  Img,
} from "@react-email/components";

interface NewsletterBroadcastProps {
  title: string;
  content: string;
  previewText: string;
}

const NewsletterBroadcast = ({
  title,
  content,
  previewText,
}: NewsletterBroadcastProps) => {
  return (
    <Html lang="en" dir="ltr">
      <Tailwind>
        <Head />
        <Preview>{previewText}</Preview>
        <body className="bg-gray-100 font-sans py-[24px]">
          <Container className="max-w-[600px] mx-auto bg-white shadow-lg overflow-hidden">
            {/* Header Section */}
            <Section className="bg-[#006633] px-[24px] py-[28px] text-center">
              <Img
                src={
                  `${process.env.NEXT_PUBLIC_APP_URL}/logo.png` ||
                  "http://localhost:3000/logo.png"
                }
                alt="Northwest Governors Forum"
                width="180"
                height="50"
                className="mx-auto mb-[6px]"
              />
              <Text className="text-white text-[16px] m-0 opacity-90">
                Newsletter Update
              </Text>
              <div className="w-[60px] h-[3px] bg-white opacity-30 mx-auto mt-[12px]"></div>
            </Section>

            {/* Main Content */}
            <Section className="px-[24px] py-[28px]">
              {/* Newsletter Title */}
              <Heading className="text-[#1a3a2e] text-[26px] font-bold m-0 mb-[24px] text-center">
                {title}
              </Heading>

              {/* Newsletter Content */}
              <div className="bg-white p-[24px] border-2 border-[#dce4dc]">
                <div
                  className="text-gray-700 text-[15px] leading-[1.6] m-0"
                  dangerouslySetInnerHTML={{ __html: content }}
                />
              </div>
            </Section>

            <Hr className="border-[#dce4dc] my-[24px]" />

            {/* Footer */}
            <Section className="bg-[#006633] px-[24px] py-[24px] text-center">
              <Text className="text-white text-[13px] m-0 mb-[12px] opacity-90">
                Thank you for subscribing to the Northwest Governors Forum
                newsletter.
              </Text>

              <div className="border-t border-white border-opacity-20 pt-[16px] mt-[16px]">
                <Text className="text-white text-[11px] m-0 mb-[6px] opacity-80">
                  © {new Date().getFullYear()} Northwest Governors Forum. All
                  rights reserved.
                </Text>
                <Text className="text-white text-[11px] m-0 mb-[6px] opacity-70">
                  Northwest Region, Nigeria
                </Text>
                <Text className="text-white text-[10px] m-0 opacity-60">
                  You're receiving this email because you subscribed to our
                  newsletter.{" "}
                  <a href="#" className="text-white underline">
                    Unsubscribe
                  </a>
                </Text>
              </div>
            </Section>
          </Container>
        </body>
      </Tailwind>
    </Html>
  );
};

export default NewsletterBroadcast;
