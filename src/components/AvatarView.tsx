import React, { memo, useMemo } from 'react';
import { SvgXml } from 'react-native-svg';
import { AvatarConfig, avatarSvg } from '../profile/avatar';

interface Props {
  config: AvatarConfig;
  size: number;
  /** Küçük önizlemelerde yüze ya da gövdeye yakınlaştırır */
  zoom?: 'face' | 'body';
  background?: boolean;
}

function AvatarView({ config, size, zoom, background = true }: Props) {
  const xml = useMemo(() => avatarSvg(config, zoom, background), [config, zoom, background]);
  return <SvgXml xml={xml} width={size} height={size} />;
}

export default memo(AvatarView);
