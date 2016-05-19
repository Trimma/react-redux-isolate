import DockMonitor from 'redux-devtools-dock-monitor';
import Inspector from 'redux-devtools-inspector';
import LogMonitor from 'redux-devtools-log-monitor';
import React from 'react';
import { createDevTools } from 'redux-devtools';

const DevTools = createDevTools(
	<DockMonitor
		defaultIsVisible={true}
		toggleVisibilityKey='ctrl-h'
		changePositionKey='ctrl-q'
		changeMonitorKey='ctrl-m'
	>
		<LogMonitor theme='nicinabox' />
		<Inspector theme='nicinabox' />
	</DockMonitor>
);

export default DevTools;
