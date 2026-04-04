import Head from 'next/head';
import { Alert, Box, Card, Code, Divider, List, Stack, Text, ThemeIcon, Title } from '@mantine/core';
import { IconCheck, IconInfoCircle, IconShieldLock } from '@tabler/icons-react';
import AppLayout from '@components/templates/AppLayout.template';

type SetupTemplateProps = {
  headDescription: string;
  headTitle: string;
};

export default function SetupTemplate({ headDescription, headTitle }: SetupTemplateProps) {
  return (
    <>
      <Head>
        <title>{headTitle}</title>
        <meta name="description" content={headDescription} />
      </Head>

      <AppLayout>
        <Stack gap="xl">
          <Card
            radius="lg"
            p={{ base: 20, sm: 28 }}
            withBorder
            style={{
              background:
                'linear-gradient(180deg, rgba(17, 24, 39, 0.96) 0%, rgba(9, 18, 33, 0.92) 100%)',
              borderColor: 'rgba(255,255,255,0.08)',
            }}
          >
            <Stack gap="lg">
              <Box
                style={{
                  width: 52,
                  height: 52,
                  borderRadius: 16,
                  display: 'grid',
                  placeItems: 'center',
                  background: 'rgba(87, 199, 166, 0.12)',
                  color: '#67cfae',
                  border: '1px solid rgba(87, 199, 166, 0.25)',
                }}
              >
                <IconShieldLock size={24} />
              </Box>

              <Stack gap={6}>
                <Title order={1} fz={{ base: 28, sm: 34 }}>
                  First-time setup
                </Title>
                <Text c="dimmed" size="sm" maw={700}>
                  Add your Binance API credentials before using the scanner. This app checks the environment on the
                  server, so once both variables exist you will be sent straight to the home page.
                </Text>
              </Stack>

              <Divider color="rgba(255,255,255,0.08)" />

              <Stack gap="md">
                <Title order={2} fz="h4">
                  Create or update `.env.local`
                </Title>
                <Card
                  radius="md"
                  p="md"
                  withBorder
                  style={{
                    backgroundColor: 'rgba(255,255,255,0.03)',
                    borderColor: 'rgba(255,255,255,0.08)',
                  }}
                >
                  <Code
                    block
                    style={{
                      whiteSpace: 'pre-wrap',
                      wordBreak: 'break-word',
                      fontSize: 14,
                      lineHeight: 1.6,
                    }}
                  >
                    {`BINANCE_API_KEY=your_api_key_here
BINANCE_SECRET_KEY=your_secret_key_here`}
                  </Code>
                </Card>
              </Stack>

              <Alert
                variant="light"
                color="blue"
                icon={<IconInfoCircle size={16} />}
                title="Important"
              >
                Restart the dev server after editing env files. If you deploy to Vercel later, set the same variables
                in Project Settings, not in a static file.
              </Alert>

              <List
                spacing="sm"
                size="sm"
                icon={
                  <ThemeIcon color="teal" size={18} radius="xl">
                    <IconCheck size={12} />
                  </ThemeIcon>
                }
              >
                <List.Item>Use the credentials only on your local machine or in server-side env vars.</List.Item>
                <List.Item>Do not put them in `NEXT_PUBLIC_*` variables.</List.Item>
                <List.Item>Once both env vars exist, the app will redirect away from this page automatically.</List.Item>
              </List>
            </Stack>
          </Card>
        </Stack>
      </AppLayout>
    </>
  );
}
