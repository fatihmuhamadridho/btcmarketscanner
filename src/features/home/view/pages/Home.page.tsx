import HomeTemplate from '../templates/HomeTemplate.template';
import { getHomeCardChangeBadgeColor, useHomePageLogic } from '../../logic/Home.logic';

export default function Home() {
  const { currentPage, marketItems, setActivePage, setSortMode, sortMode, totalPages, visibleMarketItems } =
    useHomePageLogic();
  const coinCards = visibleMarketItems.map((coin) => ({
    changeBadgeColor: getHomeCardChangeBadgeColor(Number(coin.ticker.priceChangePercent ?? 0)),
    baseAsset: coin.baseAsset,
    contractType: coin.contractType,
    displayChange: coin.ticker.displayChange,
    displayLastPrice: coin.ticker.displayLastPrice,
    displayName: coin.displayName,
    quoteAsset: coin.quoteAsset,
    symbol: coin.symbol,
  }));

  return (
    <HomeTemplate
      currentPage={currentPage}
      headDescription="A simple starting homepage for scanning major crypto coins."
      headTitle="BTC Market Scanner"
      coinCards={coinCards}
      marketItems={marketItems}
      setActivePage={setActivePage}
      setSortMode={setSortMode}
      sortMode={sortMode}
      totalPages={totalPages}
    />
  );
}
