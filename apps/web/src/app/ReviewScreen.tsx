import { Chip, Container, Ground, Stack, Text } from '@metaagent/design-system';
import { useState } from 'react';
import { LanguageSwitch } from '../core/presentation/LanguageSwitch';
import { reviewRegistry } from './reviewRegistry';

/** Shows any state of any screen, without clicking through the app. It never ships. */
export function ReviewScreen() {
  const [screenIndex, setScreenIndex] = useState(0);
  const [stateIndex, setStateIndex] = useState(0);
  const screen = reviewRegistry[screenIndex];
  const state = screen?.states[stateIndex] ?? screen?.states[0];
  return (
    <div>
      <Ground kind="plain">
        <Container width="wide">
          <Stack gap="s">
            <Stack direction="row" gap="s">
              <Text role="headline" as="h1">
                Review
              </Text>
              <LanguageSwitch />
            </Stack>
            <Stack direction="row" gap="xs">
              {reviewRegistry.map((item, index) => (
                <Chip
                  key={item.screen}
                  selected={index === screenIndex}
                  onClick={() => {
                    setScreenIndex(index);
                    setStateIndex(0);
                  }}
                >
                  {item.screen}
                </Chip>
              ))}
            </Stack>
            <Stack direction="row" gap="xs">
              {screen?.states.map((item, index) => (
                <Chip key={item.name} selected={index === stateIndex} onClick={() => setStateIndex(index)}>
                  {item.name}
                </Chip>
              ))}
            </Stack>
          </Stack>
        </Container>
      </Ground>
      {state?.element}
    </div>
  );
}
