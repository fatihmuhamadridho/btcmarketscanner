import { Avatar, Box, Group, Paper, Stack, Text } from '@mantine/core';
import type { AppNavbarAccountProfile } from '../interface/AppNavbar.interface';

type AppNavbarAccountProps = AppNavbarAccountProfile & {
  isLoading: boolean;
};

export default function AppNavbarAccount({
  avatarLabel,
  displayName,
  isConfigured,
  isLoading,
  subtitle,
}: AppNavbarAccountProps) {
  return (
    <Paper
      radius="xl"
      p={8}
      withBorder
      style={{
        backgroundColor: 'rgba(255,255,255,0.03)',
        borderColor: 'rgba(255,255,255,0.08)',
      }}
    >
      <Group gap={10} wrap="nowrap">
        <Avatar radius="xl" color={isConfigured ? 'cyan' : 'gray'} size={36}>
          {avatarLabel}
        </Avatar>

        <Stack gap={0} visibleFrom="sm" style={{ minWidth: 0 }}>
          <Text fw={700} size="sm" lineClamp={1}>
            {isLoading ? 'Loading account' : displayName}
          </Text>
          <Text size="xs" c="dimmed" lineClamp={1}>
            {isLoading ? 'Fetching Binance data' : subtitle}
          </Text>
        </Stack>

        <Box hiddenFrom="sm">
          <Text size="xs" fw={700} c={isConfigured ? 'cyan' : 'gray'}>
            {isLoading ? '...' : avatarLabel}
          </Text>
        </Box>
      </Group>
    </Paper>
  );
}
