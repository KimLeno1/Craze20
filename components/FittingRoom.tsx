import React from 'react';
import { ViewState, Product, UserStats, RankBenefits } from '../types';
import StyleStudioView from './StyleStudioView';

interface FittingRoomProps {
  products: Product[];
  stats: UserStats;
  rank: RankBenefits;
  onNavigate: (view: ViewState) => void;
  onLockLook?: (items: Product[]) => Promise<void> | void;
  wishlistProducts?: Product[];
  haulProducts?: Product[];
  onTryOnUsed?: () => void;
  onUpdateStats?: (stats: UserStats) => void;
  onProductClick?: (product: Product) => void;
  theme?: 'light' | 'dark';
}

const FittingRoom: React.FC<FittingRoomProps> = (props) => {
  return <StyleStudioView initialPanel="hub" {...props} />;
};

export default FittingRoom;
