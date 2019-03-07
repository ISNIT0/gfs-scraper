import React, { Component } from 'react';
import blessed, { scrollablebox } from 'blessed';
import { render } from 'react-blessed';
import { getAvailableGfsRuns } from './util';

interface AppState {
    loadingRuns: boolean;
    runs: string[];
    selectedRuns: Set<string>;
}

/**
 * Stylesheet
 */
const stylesheet = {
    bordered: {
        border: {
            type: 'line',
        },
        style: {
            border: {
                fg: 'blue',
            },
        },
    },
};

/**
 * Top level component.
 */
class Dashboard extends Component {
    public state = {
        loadingRuns: true,
        runs: [],
        selectedRuns: new Set([]),
    } as AppState;

    public async componentDidMount() {
        const runs = await getAvailableGfsRuns();
        this.setState({ loadingRuns: false, runs });
    }

    public render() {
        return (
            <element>
                <SelectRuns state={this.state} setState={this.setState.bind(this)} />
                <Jobs />
                <Stats />

                <loading
                    top='center'
                    left='center'
                    align='center'
                    height='50%'
                    width='50%'
                    tags={true}
                    hidden={!this.state.loadingRuns}
                    border='line'>Loading available runs...</loading>
            </element>
        );
    }
}

const SelectRuns = ({ state, setState }: { state: AppState, setState: any }) => {
    const runs = state.runs.map((run) => {
        const isSelected = state.selectedRuns.has(run);
        return `[${isSelected ? 'X' : ' '}] ${run}`;
    });
    return (
        <box label='Select Runs'
            class={stylesheet.bordered}
            width='60%'
            height='70%'>
            <list
                style={{ selected: { bg: 'red' } }}
                items={runs}
                vi
                keys
                mouse
                search
                focus
                onSelect={(_: any, i: number) => {
                    const selectedRuns = state.selectedRuns;
                    if (state.selectedRuns.has(state.runs[i])) {
                        selectedRuns.delete(state.runs[i]);
                    } else {
                        selectedRuns.add(state.runs[i]);
                    }
                    setState({
                        selectedRuns,
                    });
                }} />
        </box >
    );
};

/**
 * Jobs component.
 */
class Jobs extends Component {
    public render() {
        return <box label='Jobs'
            class={stylesheet.bordered}
            left='60%'
            width='40%'
            height='70%' />;
    }
}

/**
 * Stats component.
 */
class Stats extends Component {
    public render() {
        return (
            <box label='Logs'
                class={stylesheet.bordered}
                top='70%'
                left='0%'
                width='100%'
                height='31%'>
            </box>
        );
    }
}

/**
 * Rendering the screen.
 */
const screen = blessed.screen({
    autoPadding: true,
    smartCSR: true,
    title: 'react-blessed dashboard',
});

screen.key(['escape', 'q', 'C-c'], function (ch, key) {
    return process.exit(0);
});

render(<Dashboard />, screen);
