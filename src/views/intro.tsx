import React from 'react';

interface Props {
    onStartClick: () => void;
}

const Intro: React.FC<Props> = (props) => (
    <div>
        INTRO
        <div onClick={props.onStartClick}>start</div>
    </div>
);

export default Intro;
