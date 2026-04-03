import Link from 'next/link';
import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import { Box, Button, Container, Group, Paper, Stack } from '@mantine/core';
import { IconHome, IconLayoutDashboard, IconSearch } from '@tabler/icons-react';
import AppNavbarBrand from '../atoms/AppNavbarBrand.atom';
import AppNavbarSearchModal from '../molecules/AppNavbarSearchModal.molecule';
import type { AppNavbarProps } from '../interface/AppNavbar.interface';

type NavItem = {
  href: string;
  label: string;
};

const NAV_ITEMS: NavItem[] = [
  {
    href: '/',
    label: 'Home',
  },
  {
    href: '/coin/BTCUSDT',
    label: 'BTCUSDT',
  },
];

export default function AppNavbar({ isMarketLoading, marketItems }: AppNavbarProps) {
  const router = useRouter();
  const [isSearchOpened, setIsSearchOpened] = useState(false);
  const isCoinRoute = router.pathname.startsWith('/coin/');

  useEffect(() => {
    const handleKeyDown = (event: globalThis.KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault();
        setIsSearchOpened(true);
      }
    };

    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  const openSearch = () => {
    setIsSearchOpened(true);
  };

  const closeSearch = () => {
    setIsSearchOpened(false);
  };

  const handleSelectSymbol = async (symbol: string) => {
    await router.push(`/coin/${symbol}`);
  };

  return (
    <Box
      component="header"
      py={{ base: 10, sm: 18 }}
      px={{ base: 8, sm: 24 }}
      style={{
        position: 'sticky',
        top: 0,
        zIndex: 120,
        background: 'transparent',
      }}
    >
      <Container size="lg">
        <Paper
          radius="lg"
          withBorder
          p={{ base: 10, sm: 18 }}
          style={{
            backgroundColor: 'rgba(9, 18, 33, 1)',
            borderColor: 'rgba(255,255,255,0.08)',
            boxShadow: '0 12px 36px rgba(0, 0, 0, 0.2)',
          }}
        >
          <Stack gap={10}>
            <Group justify="space-between" align="flex-start" gap="md" wrap="nowrap">
              <AppNavbarBrand isCoinRoute={isCoinRoute} />

              <Button
                variant="light"
                color="cyan"
                radius="xl"
                size="sm"
                leftSection={<IconSearch size={16} />}
                rightSection={<strong style={{ fontSize: 12, opacity: 0.8 }}>⌘K</strong>}
                onClick={openSearch}
                visibleFrom="sm"
              >
                Search
              </Button>

              <Button
                variant="light"
                color="cyan"
                radius="xl"
                size="sm"
                aria-label="Search coins"
                onClick={openSearch}
                hiddenFrom="sm"
                px={12}
              >
                <IconSearch size={16} />
              </Button>
            </Group>

            <Group gap={8} wrap="nowrap" style={{ overflowX: 'auto', maxWidth: '100%' }}>
              {NAV_ITEMS.map((item) => {
                const isActive = item.href === '/' ? router.pathname === '/' : router.pathname.startsWith('/coin/');

                return (
                  <Button
                    key={item.href}
                    component={Link}
                    href={item.href}
                    variant={isActive ? 'light' : 'subtle'}
                    color={isActive ? 'cyan' : 'gray'}
                    radius="xl"
                    size="sm"
                    leftSection={item.href === '/' ? <IconHome size={16} /> : <IconLayoutDashboard size={16} />}
                    style={{ flex: '0 0 auto' }}
                  >
                    {item.label}
                  </Button>
                );
              })}
            </Group>
          </Stack>
        </Paper>
      </Container>

      <AppNavbarSearchModal
        opened={isSearchOpened}
        onClose={closeSearch}
        isMarketLoading={isMarketLoading}
        marketItems={marketItems}
        onSelectSymbol={handleSelectSymbol}
      />
    </Box>
  );
}
