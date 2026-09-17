'use client';

import { useEditMode } from './EditModeProvider';
import { useBlocksOptional } from './BlocksContext';
import { BlockOutlinePanel } from './BlockOutlinePanel';
import type { ReactNode } from 'react';

interface LeftRailSwitchProps {
  tocContent: ReactNode;
}

export function LeftRailSwitch({ tocContent }: LeftRailSwitchProps) {
  const { isEditMode } = useEditMode();
  const blocksCtx = useBlocksOptional();

  if (isEditMode && blocksCtx) {
    return <BlockOutlinePanel />;
  }

  return <>{tocContent}</>;
}
