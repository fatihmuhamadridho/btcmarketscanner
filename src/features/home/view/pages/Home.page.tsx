import HomeTemplate from '../templates/HomeTemplate.template';
import { getHomeCardChangeBadgeColor, useHomePageLogic } from '../../logic/Home.logic';

export default function Home() {
  const { currentPage, error, exchangeInfo, isLoading, marketItems, setActivePage, totalPages, visibleMarketItems } =
    useHomePageLogic();
  const coinCards = visibleMarketItems.map((coin) => ({
    changeBadgeColor: getHomeCardChangeBadgeColor(Number(coin.ticker.priceChangePercent ?? 0)),
    baseAsset: coin.baseAsset,
    contractType: coin.contractType,
    displayChange: coin.ticker.displayChange,
    displayLastPrice: coin.ticker.displayLastPrice,
    displayName: coin.displayName,
    pair: coin.pair,
    quoteAsset: coin.quoteAsset,
    status: coin.status,
    symbol: coin.symbol,
  }));

  return (
    <HomeTemplate
      currentPage={currentPage}
      error={Boolean(error)}
      exchangeInfo={exchangeInfo}
      headDescription="A simple starting homepage for scanning major crypto coins."
      headTitle="BTC Market Scanner"
      isLoading={isLoading}
      coinCards={coinCards}
      marketItems={marketItems}
      setActivePage={setActivePage}
      totalPages={totalPages}
    />
  );
}
