import React from 'react';
import { renderToString } from 'react-dom/server';
import { Templates } from './src/components/Templates';

try {
  const html = renderToString(<Templates />);
  console.log("Render successful! Length:", html.length);
} catch (e) {
  console.error("Render failed:");
  console.error(e);
}
