import * as React from 'react';
import * as ReactDOM from 'react-dom';
import {createGlobalStyle} from 'styled-components/macro';
import Analyzer from './views/analyzer';

const GlobalStyle = createGlobalStyle`
    body {
        margin: 0;
        font-family: 'Georgia', 'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue', sans-serif;
        -webkit-font-smoothing: antialiased;
        -moz-osx-font-smoothing: grayscale;
    }
`;

ReactDOM.render(
    <>
        <GlobalStyle />
        <Analyzer />
    </>,
    document.getElementById('root')
);
