import Link from 'next/link';
import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import { Box, Button, Container, Group, Paper } from '@mantine/core';
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
      py={{ base: 14, sm: 18 }}
      px={{ base: 16, sm: 24 }}
      style={{
        position: 'sticky',
        top: 0,
        zIndex: 120,
        backdropFilter: 'blur(18px)',
        background: 'linear-gradient(180deg, rgba(6, 11, 20, 0.96) 0%, rgba(6, 11, 20, 0.72) 100%)',
      }}
    >
      <Container size="lg">
        <Paper
          radius="xl"
          withBorder
          p={{ base: 14, sm: 18 }}
          style={{
            backgroundColor: 'rgba(9, 18, 33, 0.9)',
            borderColor: 'rgba(255,255,255,0.08)',
            boxShadow: '0 12px 36px rgba(0, 0, 0, 0.2)',
          }}
        >
          <Group justify="space-between" align="center" gap="md" wrap="wrap">
            <AppNavbarBrand isCoinRoute={isCoinRoute} />

            <Group gap={8} wrap="wrap">
              {NAV_ITEMS.map((item) => {
                const isActive =
                  item.href === '/' ? router.pathname === '/' : router.pathname.startsWith('/coin/');

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
                  >
                    {item.label}
                  </Button>
                );
              })}

              <Button
                variant="light"
                color="cyan"
                radius="xl"
                size="sm"
                leftSection={<IconSearch size={16} />}
                rightSection={<strong style={{ fontSize: 12, opacity: 0.8 }}>⌘K</strong>}
                onClick={openSearch}
              >
                Search
              </Button>
            </Group>
          </Group>
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
