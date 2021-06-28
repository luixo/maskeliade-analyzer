import * as React from 'react';
import * as ReactDOM from 'react-dom';
import {createGlobalStyle} from 'styled-components/macro';
import Analyzer from './views/analyzer';

const GlobalStyle = createGlobalStyle`
    body {
        margin: 0;
        font-family: 'Styrene', 'Georgia', 'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue', sans-serif;
        -webkit-font-smoothing: antialiased;
        -moz-osx-font-smoothing: grayscale;
        background: #1a1a1a;
        color: #F0EADD;
    }
    
    @font-face {
       font-family: 'Styrene';
       src: url('styrene-bold-a.ttf') format('truetype'),
           url('styrene-medium-a.ttf') format('truetype'),
           url('styrene-regular-a.ttf') format('truetype'),
           url('styrene-thin-a.ttf') format('truetype');
    }
`;

ReactDOM.render(
    <>
        <GlobalStyle />
        <Analyzer />
    </>,
    document.getElementById('root')
);
