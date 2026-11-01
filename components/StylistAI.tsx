
import React from 'react';
import { UserStats, RankBenefits, Product, ViewState } from '../types';
import StyleStudioView from './StyleStudioView';

interface StylistAIProps {
  stats?: UserStats;
  rank?: RankBenefits;
  onUpdateStats?: (stats: UserStats) => void;
  products?: Product[];
  onProductClick?: (product: Product) => void;
  onNavigate?: (view: ViewState) => void;
  wishlistProducts?: Product[];
  haulProducts?: Product[];
}

const StylistAI: React.FC<StylistAIProps> = (props) => {
  return (
    <StyleStudioView
      initialPanel="hub"
      products={props.products || []}
      stats={props.stats || ({ aiTryOnsUsedToday: 0, stylistAiUses: 0 } as any)}
      rank={props.rank || ({ tier: 'Stylist', aiTryOnLimit: 6, stylistAiLimit: 10 } as any)}
      onNavigate={props.onNavigate || (() => {})}
      onUpdateStats={props.onUpdateStats}
      wishlistProducts={props.wishlistProducts || []}
      haulProducts={props.haulProducts || []}
      onProductClick={props.onProductClick}
    />
  );
};

export default StylistAI;
