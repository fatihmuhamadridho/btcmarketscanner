import { useEffect, useMemo, useRef, useState } from 'react';
import type { KeyboardEvent as ReactKeyboardEvent } from 'react';
import { Autocomplete, Badge, Group, Modal, Paper, Stack, Text } from '@mantine/core';
import type { AppNavbarMarketItem } from '../interface/AppNavbar.interface';

type AppNavbarSearchModalProps = {
  opened: boolean;
  onClose: () => void;
  isMarketLoading: boolean;
  marketItems: AppNavbarMarketItem[];
  onSelectSymbol: (symbol: string) => void | Promise<void>;
};

function getMarketSearchSubLabel(item: AppNavbarMarketItem) {
  const parts = [item.baseAsset, item.quoteAsset].filter(Boolean);

  return parts.length > 0 ? parts.join('/') : item.symbol;
}

function getChangeBadgeColor(priceChangePercent?: string | null) {
  const value = Number(priceChangePercent ?? 0);

  if (value > 0) {
    return 'green';
  }

  if (value < 0) {
    return 'red';
  }

  return 'gray';
}

export default function AppNavbarSearchModal({
  opened,
  onClose,
  isMarketLoading,
  marketItems,
  onSelectSymbol,
}: AppNavbarSearchModalProps) {
  const searchInputRef = useRef<HTMLInputElement | null>(null);
  const [searchValue, setSearchValue] = useState('');

  const focusSearchInput = () => {
    window.requestAnimationFrame(() => {
      searchInputRef.current?.focus();
      searchInputRef.current?.select();
    });
  };

  useEffect(() => {
    if (!opened) {
      return undefined;
    }

    const timeoutId = window.setTimeout(() => {
      focusSearchInput();
    }, 0);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [opened]);

  const searchOptions = useMemo(
    () =>
      marketItems
        .map((item) => ({
          label: item.symbol,
          value: item.symbol,
        }))
        .sort((left, right) => left.value.localeCompare(right.value)),
    [marketItems]
  );

  const marketItemMap = useMemo(() => new Map(marketItems.map((item) => [item.symbol, item])), [marketItems]);

  const closeSearch = () => {
    setSearchValue('');
    onClose();
  };

  const handleSearchSubmit = async (value: string) => {
    if (value.length === 0) {
      return;
    }

    await onSelectSymbol(value);
    closeSearch();
  };

  const handleSearchKeyDown = async (event: ReactKeyboardEvent<HTMLInputElement>) => {
    if (event.key !== 'Enter') {
      return;
    }

    const normalizedSearchValue = searchValue.trim().toLowerCase();

    if (normalizedSearchValue.length === 0) {
      return;
    }

    const exactMatch = searchOptions.find((item) => item.value.toLowerCase() === normalizedSearchValue);
    const partialMatch =
      exactMatch ??
      searchOptions.find(
        (item) =>
          item.value.toLowerCase().includes(normalizedSearchValue) || item.label.toLowerCase().includes(normalizedSearchValue)
      );

    if (partialMatch) {
      event.preventDefault();
      await handleSearchSubmit(partialMatch.value);
    }
  };

  return (
    <Modal
      opened={opened}
      onClose={closeSearch}
      onEnterTransitionEnd={focusSearchInput}
      title="Search coin"
      radius="md"
      size="lg"
      padding="xl"
      yOffset="6vh"
      overlayProps={{ blur: 10, opacity: 0.55 }}
      styles={{
        content: {
          background: 'linear-gradient(180deg, rgba(15, 24, 38, 0.98) 0%, rgba(10, 16, 28, 0.98) 100%)',
          border: '1px solid rgba(255,255,255,0.08)',
          boxShadow: '0 30px 90px rgba(0, 0, 0, 0.45)',
          borderRadius: 20,
        },
        header: {
          backgroundColor: 'transparent',
        },
        title: {
          fontWeight: 800,
          letterSpacing: '-0.02em',
        },
        body: {
          paddingTop: 0,
        },
      }}
    >
      <Stack gap="md">
        <Paper
          radius="lg"
          p="md"
          withBorder
          style={{
            backgroundColor: 'rgba(255,255,255,0.03)',
            borderColor: 'rgba(255,255,255,0.08)',
          }}
        >
          <Stack gap={6}>
            <Group justify="space-between" align="center">
              <Text size="sm" fw={700}>
                Find a coin fast
              </Text>
              <Badge variant="light" color="cyan">
                {isMarketLoading ? 'Loading...' : `${marketItems.length} markets`}
              </Badge>
            </Group>
            <Text size="sm" c="dimmed">
              Type a symbol and press Enter, or pick a result below.
            </Text>
          </Stack>
        </Paper>

        <Autocomplete
          ref={searchInputRef}
          autoFocus
          data-autofocus
          data={searchOptions}
          value={searchValue}
          onChange={setSearchValue}
          onOptionSubmit={handleSearchSubmit}
          onKeyDown={handleSearchKeyDown}
          placeholder="Search BTCUSDT, ETHUSDT, SOLUSDT..."
          rightSection={<Text size="xs" c="dimmed" fw={700}>⌘K</Text>}
          clearable
          autoSelectOnBlur
          openOnFocus
          limit={8}
          withScrollArea
          maxDropdownHeight={320}
          comboboxProps={{
            position: 'bottom-start',
            offset: 8,
            middlewares: {
              flip: false,
              shift: {
                padding: 12,
              },
              inline: false,
            },
          }}
          renderOption={({ option }) => {
            const item = marketItemMap.get(option.value);
            const itemTicker = item?.ticker ?? null;
            const changeBadgeColor = itemTicker ? getChangeBadgeColor(itemTicker.priceChangePercent) : 'gray';

            return (
              <Group justify="space-between" align="center" wrap="nowrap" w="100%">
                <Stack gap={2}>
                  <Text fw={800} size="sm">
                    {option.value}
                  </Text>
                  {item ? (
                    <Group gap={8} wrap="nowrap">
                      <Text size="xs" c="dimmed">
                        {getMarketSearchSubLabel(item)}
                      </Text>
                      <Text size="xs" c="dimmed">
                        ·
                      </Text>
                      <Text size="xs" c="dimmed">
                        {item.ticker?.displayLastPrice ?? 'n/a'}
                      </Text>
                    </Group>
                  ) : (
                    <Text size="xs" c="dimmed">
                      {option.value}
                    </Text>
                  )}
                </Stack>
                {itemTicker ? (
                  <Badge variant="light" color={changeBadgeColor} size="sm">
                    {itemTicker.displayChange ?? 'n/a'}
                  </Badge>
                ) : (
                  <Text size="xs" c="dimmed" tt="uppercase" style={{ letterSpacing: 1 }}>
                    coin
                  </Text>
                )}
              </Group>
            );
          }}
          styles={{
            input: {
              height: 50,
              borderRadius: 14,
              backgroundColor: 'rgba(255,255,255,0.04)',
              borderColor: 'rgba(255,255,255,0.08)',
            },
            dropdown: {
              marginTop: 10,
              borderRadius: 14,
              backgroundColor: 'rgba(15, 24, 38, 0.98)',
              border: '1px solid rgba(255,255,255,0.08)',
              boxShadow: '0 24px 60px rgba(0, 0, 0, 0.45)',
              padding: 8,
            },
            option: {
              borderRadius: 10,
              padding: '10px 12px',
            },
          }}
        />

        <Text size="xs" c="dimmed" ta="center">
          {isMarketLoading ? 'Loading market list...' : 'Use command + K or ctrl + K to open search.'}
        </Text>
      </Stack>
    </Modal>
  );
}
