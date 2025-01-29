// ==UserScript==
// @name         Keywords Highlighter
// @namespace    https://github.com/FalseSunrise
// @version      2.0.0
// @description  Simple keywords and PhD highlighter that works on every web page
// @author       FalseSunrise
// @match        *://*/*
// @icon         data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTVweCIgaGVpZ2h0PSIxNXB4IiBjbGlwLXJ1bGU9ImV2ZW5vZGQiIGZpbGwtcnVsZT0iZXZlbm9kZCIgc3Ryb2tlLWxpbmVqb2luPSJyb3VuZCIgc3Ryb2tlLW1pdGVybGltaXQ9IjIiIHZpZXdCb3g9IjIgMiAyMCAyMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cGF0aCBkPSJtMTIuMDAyIDJjNS41MTggMCA5Ljk5OCA0LjQ4IDkuOTk4IDkuOTk4IDAgNS41MTctNC40OCA5Ljk5Ny05Ljk5OCA5Ljk5Ny01LjUxNyAwLTkuOTk3LTQuNDgtOS45OTctOS45OTcgMC01LjUxOCA0LjQ4LTkuOTk4IDkuOTk3LTkuOTk4em0tLjc0NyA5LjI1aC0zLjVjLS40MTQgMC0uNzUuMzM2LS43NS43NXMuMzM2Ljc1Ljc1Ljc1aDMuNXYzLjVjMCAuNDE0LjMzNi43NS43NS43NXMuNzUtLjMzNi43NS0uNzV2LTMuNWgzLjVjLjQxNCAwIC43NS0uMzM2Ljc1LS43NXMtLjMzNi0uNzUtLjc1LS43NWgtMy41di0zLjVjMC0uNDE0LS4zMzYtLjc1LS43NS0uNzVzLS43NS4zMzYtLjc1Ljc1eiIgZmlsbC1ydWxlPSJub256ZXJvIiBmaWxsPSJsaWdodGdyZWVuIi8+PC9zdmc+
// @grant        GM_setValue
// @grant        GM_getValue
// @grant        GM_addValueChangeListener
// @grant        GM_addStyle
// @noframes
// ==/UserScript==

(function() {
    'use strict';

    let logs = 0;

    function log(...args){
        if (logs == 1){
            console.log(...args)
        }
    }

// Settings
    let phdStrings = ['PhD', 'Ph.D', 'Ph. D', 'Dr ', 'Dr.', 'кандидат наук', 'к.и.н', 'доктор наук', 'д.н', 'Doctor of Philosophy', 'Dr. rer. nat.', 'Doctorate', 'Doctor', '博士', 'CSc.', 'доктор', 'DSc', 'D.Sc', 'Кандидат технических наук', 'dottore'];

    let colors = {
        phd: 'rgb(134 0 142)',
        k1: 'rgb(77, 90, 255)',
        k2: 'rgb(252, 63, 83)',
        k3: 'rgb(0, 242, 255)',//'rgb(0, 121, 128)'
        k4: 'rgb(20, 128, 40)',
        k5: 'rgb(249, 192, 63)',
        k6: 'rgb(255, 192, 203)',
     }

// Variables
    let isHighlighted = {
        phd: false,
        k1: false,
        k2: false,
        k3: false,
        k4: false,
        k5: false,
        k6: false,
    }
    let currentlyFocusedIndeces = {
        phd: 0,
        k1: 0,
        k2: 0,
        k3: 0,
        k4: 0,
        k5: 0,
        k6: 0,
    }
    let currentlyFocusedKeyword

// Cross-tab stored variables
    let keywords = GM_getValue('keywords', {
        k1: undefined,
        k2: undefined,
        k3: undefined,
        k4: undefined,
        k5: undefined,
        k6: undefined,
    });
    GM_addValueChangeListener('keywords', (key, oldValue, newValue, remote) => {// Cross-tab keywords list sync
        if (remote){
            keywords = newValue
            let newKeywordsKeys = Object.keys(newValue)
            let oldKeywordsKeys = Object.keys(oldValue)

            oldKeywordsKeys.forEach((keywordKey) => {
                if (!newKeywordsKeys.includes(keywordKey)) {
                    removeKeyword(keywordKey)
                }
            })
            newKeywordsKeys.forEach((keywordKey) => {
                if (!oldKeywordsKeys.includes(keywordKey)) {
                    updateLabel(keywordKey)
                    setKeywordsList();
                    adjustFrameSize();
                    updateMaxCount(keywordKey)
                } else if (newValue[keywordKey != oldValue[keywordKey]]) {
                    removeKeyword(keywordKey)
                    updateLabel(keywordKey)
                    setKeywordsList();
                    adjustFrameSize();
                    updateMaxCount(keywordKey)
                }
            })
        }
    });

    let boxProperties = GM_getValue('boxProperties', {
        isLeftPanelVisible: true,
        isRightPanelVisible: true,
        areUndefinedKeywordsVisible: true,
    });
    let boxLastPos = GM_getValue('boxLastPos', ['0', '0', '0', '0']);
    let isBoxVisible = GM_getValue('isBoxVisible', true);

// Box elements
    let iframeDiv = undefined
    let frame
    let iframeDocument
    let captionBar
    let keywordsList
    let leftPanelButtons
    let rightPanelButtons
    let leftArrowButton
    let rightArrowButton
    let bottomArrowButton
    let phdBtn

// Icons
    let arrowIcon = "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTVweCIgaGVpZ2h0PSIxNXB4IiB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAyNCAyNCI+PHBhdGggZD0iTTEyIDBjLTYuNjI3IDAtMTIgNS4zNzMtMTIgMTJzNS4zNzMgMTIgMTIgMTIgMTItNS4zNzMgMTItMTItNS4zNzMtMTItMTItMTJ6bS0zIDE3di0xMGw5IDUuMTQ2LTkgNC44NTR6IiAgZmlsbD0iI2RjZGNkYyIvPjwvc3ZnPg=="
    let arrowIconHover = "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTVweCIgaGVpZ2h0PSIxNXB4IiAgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIiB2aWV3Qm94PSIwIDAgMjQgMjQiPjxwYXRoIGQ9Ik0xMiAyYzUuNTE0IDAgMTAgNC40ODYgMTAgMTBzLTQuNDg2IDEwLTEwIDEwLTEwLTQuNDg2LTEwLTEwIDQuNDg2LTEwIDEwLTEwem0wLTJjLTYuNjI3IDAtMTIgNS4zNzMtMTIgMTJzNS4zNzMgMTIgMTIgMTIgMTItNS4zNzMgMTItMTItNS4zNzMtMTItMTItMTJ6bS0zIDE3di0xMGw5IDUuMTQ2LTkgNC44NTR6IiBmaWxsPSIjZGNkY2RjIi8+PC9zdmc+"
    let addIcon = "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTVweCIgaGVpZ2h0PSIxNXB4IiBjbGlwLXJ1bGU9ImV2ZW5vZGQiIGZpbGwtcnVsZT0iZXZlbm9kZCIgc3Ryb2tlLWxpbmVqb2luPSJyb3VuZCIgc3Ryb2tlLW1pdGVybGltaXQ9IjIiIHZpZXdCb3g9IjIgMiAyMCAyMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cGF0aCBkPSJtMTIuMDAyIDJjNS41MTggMCA5Ljk5OCA0LjQ4IDkuOTk4IDkuOTk4IDAgNS41MTctNC40OCA5Ljk5Ny05Ljk5OCA5Ljk5Ny01LjUxNyAwLTkuOTk3LTQuNDgtOS45OTctOS45OTcgMC01LjUxOCA0LjQ4LTkuOTk4IDkuOTk3LTkuOTk4em0tLjc0NyA5LjI1aC0zLjVjLS40MTQgMC0uNzUuMzM2LS43NS43NXMuMzM2Ljc1Ljc1Ljc1aDMuNXYzLjVjMCAuNDE0LjMzNi43NS43NS43NXMuNzUtLjMzNi43NS0uNzV2LTMuNWgzLjVjLjQxNCAwIC43NS0uMzM2Ljc1LS43NXMtLjMzNi0uNzUtLjc1LS43NWgtMy41di0zLjVjMC0uNDE0LS4zMzYtLjc1LS43NS0uNzVzLS43NS4zMzYtLjc1Ljc1eiIgZmlsbC1ydWxlPSJub256ZXJvIiBmaWxsPSJsaWdodGdyZWVuIi8+PC9zdmc+"
    let addIconHover = "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTVweCIgaGVpZ2h0PSIxNXB4IiBjbGlwLXJ1bGU9ImV2ZW5vZGQiIGZpbGwtcnVsZT0iZXZlbm9kZCIgc3Ryb2tlLWxpbmVqb2luPSJyb3VuZCIgc3Ryb2tlLW1pdGVybGltaXQ9IjIiIHZpZXdCb3g9IjIgMiAyMCAyMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KICA8cGF0aCBkPSJtMTIuMDAyIDJjNS41MTggMCA5Ljk5OCA0LjQ4IDkuOTk4IDkuOTk4IDAgNS41MTctNC40OCA5Ljk5Ny05Ljk5OCA5Ljk5Ny01LjUxNyAwLTkuOTk3LTQuNDgtOS45OTctOS45OTcgMC01LjUxOCA0LjQ4LTkuOTk4IDkuOTk3LTkuOTk4em0wIDEuNWMtNC42OSAwLTguNDk3IDMuODA4LTguNDk3IDguNDk4czMuODA3IDguNDk3IDguNDk3IDguNDk3IDguNDk4LTMuODA3IDguNDk4LTguNDk3LTMuODA4LTguNDk4LTguNDk4LTguNDk4em0tLjc0NyA3Ljc1aC0zLjVjLS40MTQgMC0uNzUuMzM2LS43NS43NXMuMzM2Ljc1Ljc1Ljc1aDMuNXYzLjVjMCAuNDE0LjMzNi43NS43NS43NXMuNzUtLjMzNi43NS0uNzV2LTMuNWgzLjVjLjQxNCAwIC43NS0uMzM2Ljc1LS43NXMtLjMzNi0uNzUtLjc1LS43NWgtMy41di0zLjVjMC0uNDE0LS4zMzYtLjc1LS43NS0uNzVzLS43NS4zMzYtLjc1Ljc1eiIgZmlsbC1ydWxlPSJub256ZXJvIiBmaWxsPSJsaWdodGdyZWVuIi8+Cjwvc3ZnPg=="
    let removeIcon = "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTVweCIgaGVpZ2h0PSIxNXB4IiBjbGlwLXJ1bGU9ImV2ZW5vZGQiIGZpbGwtcnVsZT0iZXZlbm9kZCIgc3Ryb2tlLWxpbmVqb2luPSJyb3VuZCIgc3Ryb2tlLW1pdGVybGltaXQ9IjIiIHZpZXdCb3g9IjIgMiAyMCAyMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cGF0aCBkPSJtMTIuMDAyIDIuMDA1YzUuNTE4IDAgOS45OTggNC40OCA5Ljk5OCA5Ljk5NyAwIDUuNTE4LTQuNDggOS45OTgtOS45OTggOS45OTgtNS41MTcgMC05Ljk5Ny00LjQ4LTkuOTk3LTkuOTk4IDAtNS41MTcgNC40OC05Ljk5NyA5Ljk5Ny05Ljk5N3ptMCA4LjkzMy0yLjcyMS0yLjcyMmMtLjE0Ni0uMTQ2LS4zMzktLjIxOS0uNTMxLS4yMTktLjQwNCAwLS43NS4zMjQtLjc1Ljc0OSAwIC4xOTMuMDczLjM4NC4yMTkuNTMxbDIuNzIyIDIuNzIyLTIuNzI4IDIuNzI4Yy0uMTQ3LjE0Ny0uMjIuMzQtLjIyLjUzMSAwIC40MjcuMzUuNzUuNzUxLjc1LjE5MiAwIC4zODQtLjA3My41My0uMjE5bDIuNzI4LTIuNzI4IDIuNzI5IDIuNzI4Yy4xNDYuMTQ2LjMzOC4yMTkuNTMuMjE5LjQwMSAwIC43NS0uMzIzLjc1LS43NSAwLS4xOTEtLjA3My0uMzg0LS4yMi0uNTMxbC0yLjcyNy0yLjcyOCAyLjcxNy0yLjcxN2MuMTQ2LS4xNDcuMjE5LS4zMzguMjE5LS41MzEgMC0uNDI1LS4zNDYtLjc1LS43NS0uNzUtLjE5MiAwLS4zODUuMDczLS41MzEuMjJ6IiBmaWxsLXJ1bGU9Im5vbnplcm8iIGZpbGw9InJlZCIvPjwvc3ZnPg=="
    let removeIconHover = "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTVweCIgaGVpZ2h0PSIxNXB4IiBjbGlwLXJ1bGU9ImV2ZW5vZGQiIGZpbGwtcnVsZT0iZXZlbm9kZCIgc3Ryb2tlLWxpbmVqb2luPSJyb3VuZCIgc3Ryb2tlLW1pdGVybGltaXQ9IjIiIHZpZXdCb3g9IjIgMiAyMCAyMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cGF0aCBkPSJtMTIuMDAyIDIuMDA1YzUuNTE4IDAgOS45OTggNC40OCA5Ljk5OCA5Ljk5NyAwIDUuNTE4LTQuNDggOS45OTgtOS45OTggOS45OTgtNS41MTcgMC05Ljk5Ny00LjQ4LTkuOTk3LTkuOTk4IDAtNS41MTcgNC40OC05Ljk5NyA5Ljk5Ny05Ljk5N3ptMCAxLjVjLTQuNjkgMC04LjQ5NyAzLjgwNy04LjQ5NyA4LjQ5N3MzLjgwNyA4LjQ5OCA4LjQ5NyA4LjQ5OCA4LjQ5OC0zLjgwOCA4LjQ5OC04LjQ5OC0zLjgwOC04LjQ5Ny04LjQ5OC04LjQ5N3ptMCA3LjQyNSAyLjcxNy0yLjcxOGMuMTQ2LS4xNDYuMzM5LS4yMTkuNTMxLS4yMTkuNDA0IDAgLjc1LjMyNS43NS43NSAwIC4xOTMtLjA3My4zODQtLjIxOS41MzFsLTIuNzE3IDIuNzE3IDIuNzI3IDIuNzI4Yy4xNDcuMTQ3LjIyLjMzOS4yMi41MzEgMCAuNDI3LS4zNDkuNzUtLjc1Ljc1LS4xOTIgMC0uMzg0LS4wNzMtLjUzLS4yMTlsLTIuNzI5LTIuNzI4LTIuNzI4IDIuNzI4Yy0uMTQ2LjE0Ni0uMzM4LjIxOS0uNTMuMjE5LS40MDEgMC0uNzUxLS4zMjMtLjc1MS0uNzUgMC0uMTkyLjA3My0uMzg0LjIyLS41MzFsMi43MjgtMi43MjgtMi43MjItMi43MjJjLS4xNDYtLjE0Ny0uMjE5LS4zMzgtLjIxOS0uNTMxIDAtLjQyNS4zNDYtLjc0OS43NS0uNzQ5LjE5MiAwIC4zODUuMDczLjUzMS4yMTl6IiBmaWxsLXJ1bGU9Im5vbnplcm8iIGZpbGw9InJlZCIvPjwvc3ZnPg=="


///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
////                                                                 Interface                                                                             ////
///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////


// Iframe source document
    let iframeSource = `

<html>
<head>
<style>

html {
    margin: 0;
    height: fit-content;
    width: fit-content;
    overflow: visible;

}
body {
    margin: 0;
    height: fit-content;
    width: fit-content;
}
button {
    text-align: center;
    cursor: pointer;
    background-color: inherit;
    color: white;
    border: 0;
}
span {
    margin-left: 0.2em;
}
ol {
    list-style-type: none;
    padding:0;
    margin:0;
}
div {
    margin: 1px 0;
}
li {
    width: 100%;
}

/* Outer div */
#kwhlKeywordsDiv {
    height: fit-content;
    width: fit-content;
    background-color: rgb(39 39 39);
    font-family: Helvetica, Arial, sans-serif;
    color: white;
    font-size: 13px;
    border: 1px solid #535353;
    border-style: solid;
    margin: 0
}

/* Caption line */
#kwhlCaption {
    font-size: 18px;
    cursor: grab;
    position: absolute;
    left: 0.5em;
}
.kwhlCaptionPlaceHolder {
    width: 56%;
    padding-right: 0.4em;
    min-width: 3.25em;

}
#kwhl-phd-label {
    border: 0;
    background-color: ${colors.phd};
    margin-right: auto;
    font-size: 16px;
    z-index: 1;
    box-shadow: -0.4em 0 0.2em -0.2em rgb(39 39 39);
}
#kwhl-phd-label::after {
    content: "PhD"
}
#kwhl-phd-label:hover {
    background-color: rgb(39 39 39);
    outline: solid 1px ${colors.phd};
    color: ${colors.phd};
    filter: brightness(1.5);
}

/* Keyword labels */
.kwhlKeywordLabel {
    cursor: pointer;
    height: 15px;
}

/* Arrow bottons */
button.kwhlArrowBtn {
    border: 0;
    margin: 0 0.2em;
    padding: 0;
}
button.kwhlArrowBtn:hover {
    background-color: inherit;
    outline: solid 1px rgb(192 192 192);
    color: white;
}
#kwhlBottomArrowButton {
    box-sizing: border-box;
    display: block;
    padding: 0;
    width: 99%;
    margin: auto;
}
.kwhlArrowLabel {
    text-align: center;
    display: block;
    font-family: SimSun;
}
.kwhlArrowLabelH {
    top: 0.05em;
    position: relative;
    line-height: 0.3em;
    margin: 0;
    font-size: 27px;
}
.kwhlArrowLabelV {
    top: -0.2em;
    position: relative;
    font-size: 20px;
    padding: 0;
    height: 0.95em;
}

/* Circle bottons */
.kwhlCircleBtn {
    padding: 0;
    height: 15px;
    width: 15px;
    text-align: center;
    margin-right: 1px;
}
.kwhlCircleBtn-prev {
    transform: rotate(-90deg)
}
.kwhlCircleBtn-next {
    transform: rotate(90deg)
}
.kwhlRightPanel::before {
    content: url(${arrowIcon});
}
.kwhlRightPanel:hover::before {
    content: url(${arrowIconHover});
}
.kwhlCircleBtn-add::before {
    content: url(${addIcon})
}
.kwhlCircleBtn-add:hover::before {
    content: url(${addIconHover})
}
.kwhlCircleBtn-remove::before {
    content: url(${removeIcon})
}
.kwhlCircleBtn-remove:hover::before {
    content: url(${removeIconHover})
}

/* Keywords labels */
[data-content]:not([data-content="–"])#kwhl-k1-label {background-color: ${colors.k1}; color: ${blackWhite(colors.k1)};}
[data-content]:not([data-content="–"])#kwhl-k2-label {background-color: ${colors.k2}; color: ${blackWhite(colors.k2)};}
[data-content]:not([data-content="–"])#kwhl-k3-label {background-color: ${colors.k3}; color: ${blackWhite(colors.k3)};}
[data-content]:not([data-content="–"])#kwhl-k4-label {background-color: ${colors.k4}; color: ${blackWhite(colors.k4)};}
[data-content]:not([data-content="–"])#kwhl-k5-label {background-color: ${colors.k5}; color: ${blackWhite(colors.k5)};}
[data-content]:not([data-content="–"])#kwhl-k6-label {background-color: ${colors.k6}; color: ${blackWhite(colors.k6)};}

/* Keyword counters */
.kwhlKeywordCounter {
    margin-left: auto;
    min-width: 2.3em;
    text-align: center;
    padding: 0 0.2em;
}
[data-content="0"].kwhlKeywordCounter {
    color: red;
}

/* Focused keyword label */
.kwhlFocusedLabel {
    box-shadow: 0 0 0 1px currentcolor, 0 0 0 2px #ff00ff !important;
    z-index: 1 !important;
}

/* Create :after pseudo-element for elements with attribute data-content */
[data-content]::after {
    content: attr(data-content);
}

/* Create :before pseudo-element for counters */
[data-counter]::before {
    content: attr(data-counter) '/';
}
/* Text blinking red animation */
@keyframes blinkText {
    from {
        color: currentcolor;
    } to {
        color: red;
    }
}
.kwhl-blinkText {
    animation: blinkText 0.1s 8 alternate;
}

/* PhD button blinking red animation */
@keyframes blinkPhd {
    from {
        background-color: red;
    } to {
        background-color: ${colors.PhD};
    }
}
.kwhl-blinkPhd {
    animation: blinkPhd 0.1s 8 alternate;
    animation-fill-mode: forwards;
}
#kwhl-phd-label.kwhl-blinkPhd:hover {
    color: white;
    outline: solid 1px rgb(192 192 192);
}
.skip-animation {
    animation-duration: 1ms;
}

</style>
</head>
<body>

    <div id="kwhlKeywordsDiv">
        <div style="display: flex">
            <span id="kwhlCaption">Keywords</span>
            <button id="kwhlleftArrowButton" class="kwhlArrowBtn">
                <div class="kwhlArrowLabel kwhlArrowLabelV">⟩</div>
            </button>
            <div class="kwhlCaptionPlaceHolder"></div>
            <button id="kwhl-phd-label"></button>
            <button id="kwhlrightArrowButton" class="kwhlArrowBtn">
                <div class="kwhlArrowLabel kwhlArrowLabelV">⟨</div>
            </button>
        </div>
        <ol id="kwhlList">
            <li id="kwhl-k1-listItem" style="display: block;">
                <div style="display: flex">
                    <span>1.</span>
                    <button class="kwhlLeftPanel kwhlCircleBtn kwhlCircleBtn-add"></button>
                    <button class="kwhlLeftPanel kwhlCircleBtn kwhlCircleBtn-remove"></button>
                    <span id="kwhl-k1-label" class="kwhlKeywordLabel" data-content="–"></span>
                    <span id="kwhl-k1-count" class="kwhlKeywordCounter" data-content="–"></span>
                    <button class="kwhlRightPanel kwhlCircleBtn kwhlCircleBtn-prev"></button>
                    <button class="kwhlRightPanel kwhlCircleBtn kwhlCircleBtn-next"></button>
                </div>
            </li>
            <li id="kwhl-k2-listItem" style="display: block;">
                <div style="display: flex">
                    <span>2.</span>
                    <button class="kwhlLeftPanel kwhlCircleBtn kwhlCircleBtn-add"></button>
                    <button class="kwhlLeftPanel kwhlCircleBtn kwhlCircleBtn-remove"></button>
                    <span id="kwhl-k2-label" class="kwhlKeywordLabel" data-content="–"></span>
                    <span id="kwhl-k2-count" class="kwhlKeywordCounter" data-content="–"></span>
                    <button class="kwhlRightPanel kwhlCircleBtn kwhlCircleBtn-prev"></button>
                    <button class="kwhlRightPanel kwhlCircleBtn kwhlCircleBtn-next"></button>
                </div>
            </li>
            <li id="kwhl-k3-listItem" style="display: block;">
                <div style="display: flex">
                    <span>3.</span>
                    <button class="kwhlLeftPanel kwhlCircleBtn kwhlCircleBtn-add"></button>
                    <button class="kwhlLeftPanel kwhlCircleBtn kwhlCircleBtn-remove"></button>
                    <span id="kwhl-k3-label" class="kwhlKeywordLabel" data-content="–"></span>
                    <span id="kwhl-k3-count" class="kwhlKeywordCounter" data-content="–"></span>
                    <button class="kwhlRightPanel kwhlCircleBtn kwhlCircleBtn-prev"></button>
                    <button class="kwhlRightPanel kwhlCircleBtn kwhlCircleBtn-next"></button>
                </div>
            </li>
            <li id="kwhl-k4-listItem" style="display: block;">
                <div style="display: flex">
                    <span>4.</span>
                    <button class="kwhlLeftPanel kwhlCircleBtn kwhlCircleBtn-add"></button>
                    <button class="kwhlLeftPanel kwhlCircleBtn kwhlCircleBtn-remove"></button>
                    <span id="kwhl-k4-label" class="kwhlKeywordLabel" data-content="–"></span>
                    <span id="kwhl-k4-count" class="kwhlKeywordCounter" data-content="–"></span>
                    <button class="kwhlRightPanel kwhlCircleBtn kwhlCircleBtn-prev"></button>
                    <button class="kwhlRightPanel kwhlCircleBtn kwhlCircleBtn-next"></button>
                </div>
            </li>
            <li id="kwhl-k5-listItem" style="display: block;">
                <div style="display: flex">
                    <span>5.</span>
                    <button class="kwhlLeftPanel kwhlCircleBtn kwhlCircleBtn-add"></button>
                    <button class="kwhlLeftPanel kwhlCircleBtn kwhlCircleBtn-remove"></button>
                    <span id="kwhl-k5-label" class="kwhlKeywordLabel" data-content="–"></span>
                    <span id="kwhl-k5-count" class="kwhlKeywordCounter" data-content="–"></span>
                    <button class="kwhlRightPanel kwhlCircleBtn kwhlCircleBtn-prev"></button>
                    <button class="kwhlRightPanel kwhlCircleBtn kwhlCircleBtn-next"></button>
                </div>
            </li>
            <li id="kwhl-k6-listItem" style="display: block;">
                <div style="display: flex">
                    <span>6.</span>
                    <button class="kwhlLeftPanel kwhlCircleBtn kwhlCircleBtn-add"></button>
                    <button class="kwhlLeftPanel kwhlCircleBtn kwhlCircleBtn-remove"></button>
                    <span id="kwhl-k6-label" class="kwhlKeywordLabel" data-content="–"></span>
                    <span id="kwhl-k6-count" class="kwhlKeywordCounter" data-content="–"></span>
                    <button class="kwhlRightPanel kwhlCircleBtn kwhlCircleBtn-prev"></button>
                    <button class="kwhlRightPanel kwhlCircleBtn kwhlCircleBtn-next"></button>
                </div>
            </li>
        </ol>
        <div>
            <button id="kwhlBottomArrowButton" class="kwhlArrowBtn">
                <div class="kwhlArrowLabel kwhlArrowLabelH">︿</div>
            </button>
        </div>
    </div>
</body>
</html>
`

// Create the box interface
    if (isBoxVisible) {
        initializeBox()
    }

    function initializeBox(){

// Create the parent div
        iframeDiv = document.createElement('div');
        iframeDiv.id = 'kwhlIframeDiv';
        iframeDiv.style = `
            display: inline;
            position: fixed;
            z-index: 2147483647;
            top: ${boxLastPos[0]}; right: ${boxLastPos[1]}; bottom: ${boxLastPos[2]}; left: ${boxLastPos[3]};
            height: max-content;
            width: max-content;
            border: 0;
            line-height: 0;
            background-color: transparent;
        `;

// Fake caption bar for dragging
        let fakeCaptionBar = document.createElement('span')
        fakeCaptionBar.id = 'kwhl-fakeCaption'
        fakeCaptionBar.style = `
            display: none;
            font-size: 18px;
            cursor: grab;
            position: absolute;
            left: 0.7em;
            top: 2px;
            right: 2.8em;
            height: 21px;
            max-width: 80px;
        `

// Create iframe
        frame = document.createElement('iframe')
        frame.srcdoc = iframeSource
        frame.scrolling = "no"
        frame.id = 'kwhl-Iframe'
        frame.style = `
            width: 20px;
            height: 20px;
            border: 0;
            margin: 0;
        `;

// Prepend box to document
        iframeDiv.append(fakeCaptionBar, frame)
        document.body.prepend(iframeDiv);

// Get the loaded iframe document and its important elements
        frame.addEventListener("load", function() {
            iframeDocument = this.contentDocument;
            captionBar = iframeDocument.querySelector('#kwhlCaption');
            keywordsList = iframeDocument.querySelector('#kwhlList');
            leftPanelButtons = iframeDocument.querySelectorAll('.kwhlLeftPanel')
            rightPanelButtons = iframeDocument.querySelectorAll('.kwhlRightPanel')
            leftArrowButton = iframeDocument.querySelector('#kwhlleftArrowButton')
            rightArrowButton = iframeDocument.querySelector('#kwhlrightArrowButton')
            bottomArrowButton = iframeDocument.querySelector('#kwhlBottomArrowButton')
            phdBtn = iframeDocument.querySelector('#kwhl-phd-label')
// Call functions for box mechanics
            dragBox()
            setCaptionDummy()
            updateAllLabels()
            updateAllMaxCounts()
            updateFocusedCounter()
            setLeftPanel()
            setRightPanel()
            setKeywordsList()
            adjustFrameSize()
            enableButtons()
            setFocusInBox()

            setPhdButtonColor()
            if (phdBtn.classList.contains('kwhl-blinkPhd')){
                phdBtn.classList.add('skip-animation')
            }
        });

// Box dragging
        function dragBox() {
            fakeCaptionBar.onmousedown = ev => {

                frame.style.pointerEvents = 'none';
                iframeDiv.style.cursor = 'grabbing';

                ev = ev || window.event;
                ev.preventDefault();

                let x = ev.clientX
                let y = ev.clientY

                window.onmousemove = ev => {
                    ev = ev || window.event;

                    ev.preventDefault();

                    x = x - ev.clientX;
                    y = y - ev.clientY;

                    iframeDiv.style.left = `${iframeDiv.offsetLeft - x}px`;
                    iframeDiv.style.top = `${iframeDiv.offsetTop - y}px`;

                    x = ev.clientX;
                    y = ev.clientY;
                };

                window.onmouseup = () => {
                    frame.style.pointerEvents = 'auto';
                    fakeCaptionBar.style.cursor = 'grab';

                    window.onmousemove = null;
                    window.onmouseup = null;
                    resetPos();
                }
            }
        }

        function setCaptionDummy() {
            captionBar.onmouseover = () => {
                fakeCaptionBar.style.display = 'block';
            }
            fakeCaptionBar.onmouseout = () => {
                fakeCaptionBar.style.display = 'none';
            }
        }
    }

// Check if div moved out of window bounds and adjust if needed
    function resetPos() {
        let el = iframeDiv;

        if (el.offsetLeft < 0) {
            el.style.left = "0px"
        } else if (el.offsetLeft > window.innerWidth - el.offsetWidth) {
            el.style.removeProperty('left');
            el.style.right = '0px';
        };
        if (el.offsetTop < 0) {
            el.style.top = "0px"
        } else if (el.offsetTop > window.innerHeight - el.offsetHeight) {
            el.style.removeProperty('top');
            el.style.bottom = '0px';
        };

        // Store the last box position
        boxLastPos = [el.style.top, el.style.right, el.style.bottom, el.style.left]
        GM_setValue('boxLastPos', boxLastPos);
    }

// Adjust iframe size
    function adjustFrameSize() {
        frame.style.height = frame.contentWindow.document.body.offsetHeight + 'px';
        frame.style.width = frame.contentWindow.document.body.offsetWidth + 'px';
        resetPos()
    }

// Toggle showing side panels and not used keywords
    function setLeftPanel(){
        let leftBtnIcon = leftArrowButton.querySelector('div')

        if (boxProperties.isLeftPanelVisible){
            leftPanelButtons.forEach(el => {el.style.display = 'inline'});
            leftBtnIcon.innerHTML = '⟩';
        } else {
            leftPanelButtons.forEach(el => {el.style.display = 'none'});
            leftBtnIcon.innerHTML = '⟨';
        }
    }
    function setRightPanel(){
        let rightBtnIcon = rightArrowButton.querySelector('div')

        if (boxProperties.isRightPanelVisible){
            rightPanelButtons.forEach(el => {el.style.display = 'inline'});
            rightBtnIcon.innerHTML = '⟨';
        } else {
            rightPanelButtons.forEach(el => {el.style.display = 'none'});
            rightBtnIcon.innerHTML = '⟩';
        }
    }
    function setKeywordsList(){
        let bottomBtnIcon = bottomArrowButton.querySelector('div')

        if (boxProperties.areUndefinedKeywordsVisible){
            keywordsList.querySelectorAll('li').forEach((row) => {row.style.display = 'block'})
            bottomBtnIcon.innerHTML = '︿';
        } else {
            for (let i of keywordsList.querySelectorAll('li')){
                let keywordKey = i.id.split('-')[1];
                let row = keywordsList.querySelector(`#kwhl-${keywordKey}-listItem`)

                if (keywords[keywordKey] != undefined){
                    row.style.display = 'block';
                } else {
                    row.style.display = 'none';
                }
            }
            bottomBtnIcon.innerHTML = '﹀';
        }
    }

// Buttons click event handlers
    function enableButtons() {
        leftArrowButton.onclick = () => {toggleLeftPanel()}
        rightArrowButton.onclick = () => {toggleRightPanel()}
        bottomArrowButton.onclick = () => {toggleFullList()}
        phdBtn.onclick = () => {
            if (!isHighlighted.phd) {// Highlight PhD
                highlightPhd();
                setPhdButtonColor();
            } else {// Jump to next
                jumpInDirection('phd', 1)
            }
        }

        keywordsList.querySelectorAll('li').forEach((li) => {
            let keywordKey = li.id.split('-')[1]
            li.querySelector('.kwhlCircleBtn-add').onclick = () => {replaceKeyword(keywordKey); GM_setValue('keywords', keywords)}
            li.querySelector('.kwhlCircleBtn-remove').onclick = () => {removeKeyword(keywordKey); GM_setValue('keywords', keywords)}
            li.querySelector('.kwhlCircleBtn-prev').onclick = () => {
                if (!isHighlighted[keywordKey]) {
                    highlightKeywordComplete(keywordKey)
                } else {
                    jumpInDirection(keywordKey, -1)
                }
            }
            li.querySelector('.kwhlCircleBtn-next').onclick = () => {
                if (!isHighlighted[keywordKey]) {
                    highlightKeywordComplete(keywordKey)
                } else {
                    jumpInDirection(keywordKey, 1)
                }
            }
            li.querySelector('.kwhlKeywordLabel').onclick = () => {
                if (!isHighlighted[keywordKey]) {
                    highlightKeywordComplete(keywordKey)
                } else if (currentlyFocusedKeyword != keywordKey) {
                    jumpInDirection(keywordKey, 0)
                } else {
                    unhighlightKeywordComplete(keywordKey)
                }
            }
        })
    }

    function toggleLeftPanel() {
        boxProperties.isLeftPanelVisible = toggle(boxProperties.isLeftPanelVisible)
        GM_setValue('boxProperties', boxProperties);// Store box properties info
        setLeftPanel();
        adjustFrameSize();
    }
    function toggleRightPanel() {
        boxProperties.isRightPanelVisible = toggle(boxProperties.isRightPanelVisible)
        GM_setValue('boxProperties', boxProperties);// Store box properties info
        setRightPanel();
        adjustFrameSize();
    }
    function toggleFullList() {
        boxProperties.areUndefinedKeywordsVisible = toggle(boxProperties.areUndefinedKeywordsVisible)
        GM_setValue('boxProperties', boxProperties);// Store box properties info
        setKeywordsList();
        adjustFrameSize();
    }

// Toggle variable value true/false
    function toggle(value) {
        if (value){
            return false;
        } else {
            return true;
        }
    }

// Decide what color of text has better visibility on given background
    function blackWhite(rgbColor){
        return (rgbColor.split(/[^0-9]+/)[1] * 0.299 + rgbColor.split(/[^0-9]+/)[2] * 0.587 + rgbColor.split(/[^0-9]+/)[3] * 0.114) > 150
            ? '#000000'
        : '#FFFFFF';
    }


///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
////                                                                Highlighter                                                                            ////
///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////


// Add styles for highlighted keywords
    GM_addStyle(`
    .kwhl-highlighted {
        display: inline !important;
        font-size: inherit !important;
/*        background-clip: content-box;
        margin-top: inherit !important;
        margin-right: 0 !important;
        margin-bottom: inherit !important;
        margin-left: 0 !important;
        padding-top: inherit !important;
        padding-right: 0 !important;
        padding-bottom: inherit !important;
        padding-left: 0 !important;
        border-top: inherit !important;
        border-right: 0 !important;
        border-bottom: inherit !important;
        border-left: 0 !important;*/
        margin: 0 !important;
        padding: 0 !important;
        border: 0 !important;
    }`);
    for (let i in colors){
        let style = `
        .kwhl-${i} {
            background-color: ${colors[i]} !important;
            color: ${blackWhite(colors[i])} !important;
        }`

        GM_addStyle(style);
    }
// Add style for currently focused keyword
    GM_addStyle(`
    .kwhl-focused {
        box-shadow: 0 0 0 2px currentcolor, 0 0 0 5px #ff00ff;
    }`);


// Numpad key up event handlers
    let arr = [...Array(7).keys()].slice(1)// Array 1-6

    window.addEventListener('keyup', (e) => {
        let isWinPressed = e.metaKey || e.getModifierState("OS") || e.getModifierState("Super") || e.getModifierState("Win")// Get "Win" key state

// Keys 1-6
        arr.forEach((i) => {
            let keywordKey = `k${i}`

            if (e.location===3 && e.altKey && isWinPressed && e.ctrlKey && e.key == i) {
                // Remove keyword
                removeKeyword(keywordKey);
                GM_setValue('keywords', keywords)
            } else if (e.location===3 && e.altKey && isWinPressed && !e.ctrlKey && e.key == i) {
                // Add/replace keyword
                replaceKeyword(keywordKey);
                GM_setValue('keywords', keywords)
            } else if (e.location===3 && e.altKey && !isWinPressed && !e.ctrlKey && e.key == i && !isHighlighted[keywordKey] && !e.ctrlKey) {
                // Highlight keyword
                highlightKeywordComplete(keywordKey);
            } else if (e.location===3 && e.altKey && !isWinPressed && !e.ctrlKey && e.key == i && isHighlighted[keywordKey] && !e.ctrlKey) {
                // Jump to next
                jumpInDirection(keywordKey, 1);
            } else if (e.location===3 && e.altKey && !isWinPressed && e.ctrlKey && e.key == i && isHighlighted[keywordKey]) {
                // Unhighlight keyword
                unhighlightKeywordComplete(keywordKey);
            } else if (e.location===3 && e.altKey && !isWinPressed && e.ctrlKey && e.key == i && !isHighlighted[keywordKey]) {
                log(`keyword ${keywordKey} is not highlighted`)
            }
        })

// Alt + 7 key up event handler - toggle box visibility
        if (e.location===3 && e.altKey && e.key == '7') {
            if (!isBoxVisible){
                isBoxVisible = true;
                // Check if box exists, initialize if needed
                if (iframeDiv == undefined) {
                    initializeBox();
                } else {
                    iframeDiv.style.display = 'inline';
                    // Check if box is visible and move if necessary
                    resetPos();
                }
                // Store info if box should be visible
                GM_setValue('isBoxVisible', isBoxVisible);
            } else {
                isBoxVisible = false;
                iframeDiv.style.display = 'none';
                // Store info if box should be visible
                GM_setValue('isBoxVisible', isBoxVisible);
            }
        }

// Alt + 8 key up event handler - affects keywords 1-6 all at once
        if (e.location===3 && e.altKey && !e.ctrlKey && !isWinPressed && e.key == '8') {
            // Highlight all keywords
            Object.keys(keywords).forEach((keywordKey) => {
                if (!isHighlighted[keywordKey]){
                    highlightKeyword(keywordKey)
                };
            })
            updateAllMaxCounts()
            setPhdButtonColor();
        } else if (e.location===3 && e.altKey && e.key == '8' && e.ctrlKey && !isWinPressed){
            // Unhighlight all keywords
            Object.keys(keywords).forEach((keywordKey) => {
                unhighlightKeywordComplete(keywordKey)
            })
        } else if (e.location===3 && e.altKey && e.key == '8' && e.ctrlKey && isWinPressed){
            // Remove all keywords
            if (currentlyFocusedKeyword != 'phd') {
                currentlyFocusedKeyword = undefined
                updateFocusedCounter()
                removeFocus()
            }

            Object.keys(keywords).forEach((keywordKey) => {
                let id = `#kwhl-${keywordKey}-count`

                if (isHighlighted[keywordKey]) {
                    let top = document.documentElement.scrollTop;// Get current viewport position on page
                    removeHighlight(keywordKey);
                    window.scrollTo({ top: top, behavior: 'instant'});
                    isHighlighted[keywordKey] = false;
                }

                keywords[keywordKey] = undefined;
                updateLabel(keywordKey)
                currentlyFocusedIndeces[keywordKey] = 0;
                updateMaxCount(keywordKey)
                log(`keyword ${keywordKey} removed`);
            })
            GM_setValue('keywords', keywords);
            setKeywordsList();
            adjustFrameSize();
            setPhdButtonColor();
        }

// Alt + 9 key up event handler - highlight PhD
        if (e.location===3 && e.altKey && !e.ctrlKey && e.key == '9' && !isHighlighted.phd) {
            // Highlight PhD
            highlightPhd();
            setPhdButtonColor();
        } else if (e.location===3 && e.altKey && !e.ctrlKey && e.key == '9' && isHighlighted.phd) {
            // Jump to next
            jumpInDirection('phd', 1)
        } else if (e.location===3 && e.altKey && e.ctrlKey && e.key == '9') {
            // Unhighlight PhD
            unhighlightKeywordComplete('phd');
        }

    }, false);


// Core functions
    function highlightKeyword(keywordKey) {
        if (keywords[keywordKey] != null && keywords[keywordKey] != ''){
            if (ifStringExists(keywords[keywordKey])){
                let top = document.documentElement.scrollTop;// Get current viewport position on page

                highlightString(keywords[keywordKey], keywordKey);

                window.scrollTo({ top: top, behavior: 'instant'});// Return to original viewport position

                if (document.querySelectorAll(`.kwhl-${keywordKey}`).length < 1){
                    log('highlighting not successful');
                } else {
                    isHighlighted[keywordKey] = true
                    log(`highlighted keyword ${keywordKey}`);
                }
            } else {
                blinkLabel(keywordKey);
                log(`string "${keywords[keywordKey]}" not found`);
            }
        } else {
            blinkLabel(keywordKey);
            log(`string "${keywords[keywordKey]}" is not valid`);
        }
    }

    function highlightKeywordComplete(keywordKey) {
        if (keywords[keywordKey] && !isHighlighted[keywordKey]) {
            //highlight
            highlightKeyword(keywordKey)
            //update counter max
            updateMaxCount(keywordKey)

            if (isHighlighted[keywordKey]) {
                let itemClass = `.kwhl-${keywordKey}`;
                let index = currentlyFocusedIndeces[keywordKey]
                //jump to index zero
                let viewHeight = Math.max(document.documentElement.clientHeight, window.innerHeight);
                let element = document.querySelectorAll(itemClass)[index]
                //remove focus
                removeFocus()
                //add focus
                element.classList.add('kwhl-focused');
                currentlyFocusedKeyword = keywordKey;
                //update counter
                updateFocusedCounter()
                setFocusInBox()

                if (element.getBoundingClientRect().top < 70 || viewHeight - element.getBoundingClientRect().bottom < 70){
                    window.scrollTo({ top: (document.documentElement.scrollTop + element.getBoundingClientRect().top + -100), behavior: 'smooth'});
                }

            }
        }
    }

    function jumpInDirection(keywordKey, direction) {
        if (isHighlighted[keywordKey]) {
            //update counter
            let itemClass = `.kwhl-${keywordKey}`;
            let index = currentlyFocusedIndeces[keywordKey]
            let maxIndex = document.querySelectorAll(itemClass).length;

            if (currentlyFocusedKeyword == keywordKey) {
                index = index + direction;// Direction -1, 0 or 1
            }

            if (index == maxIndex) {// Start from zero if elaready at the max index
                index = 0
            } else if (index < 0) {
                index = maxIndex - 1;// Start from max index if already at zero
            }

            //jump to index
            let viewHeight = Math.max(document.documentElement.clientHeight, window.innerHeight);
            let element = document.querySelectorAll(itemClass)[index]
            //remove focus
            removeFocus()
            //add focus
            element.classList.add('kwhl-focused');
            currentlyFocusedKeyword = keywordKey;

            if (element.getBoundingClientRect().top < 70 || viewHeight - element.getBoundingClientRect().bottom < 70){
                window.scrollTo({ top: (document.documentElement.scrollTop + element.getBoundingClientRect().top + -100), behavior: 'smooth'});
            }

            currentlyFocusedIndeces[keywordKey] = index
            //update counter
            updateFocusedCounter()
            setFocusInBox()

            log(`jumping to keyword ${keywordKey}: ${index + 1}`)
        }
    }

    function unhighlightKeywordComplete(keywordKey) {
        if (isHighlighted[keywordKey]) {
            let top = document.documentElement.scrollTop;// Get current viewport position on page
            removeHighlight(keywordKey);
            window.scrollTo({ top: top, behavior: 'instant' });

            isHighlighted[keywordKey] = false;

            updateMaxCount(keywordKey)

            if (currentlyFocusedKeyword == keywordKey) {
                currentlyFocusedKeyword = undefined
                //update counter
                updateFocusedCounter()
                setFocusInBox()
                removeFocus()
            }
            log(`keyword ${keywordKey} unhighlighted`);
        }
    }

    function replaceKeyword(keywordKey) {
        let newKeyword = prompt(`Enter Keyword ${keywordKey.slice(1)}`, keywords[keywordKey]);
        if (newKeyword == '' && keywordKey != undefined){// Dalete the old keyword if entered empty string
            removeKeyword(keywordKey)
        } else if (newKeyword == null){// Maintain the old keyword if escaped prompt
            log('keyword maintained');
        } else {
            removeKeyword(keywordKey)

            keywords[keywordKey] = newKeyword;// Set new keyword
            log(`keyword ${keywordKey} changed to ${newKeyword}`);

            updateLabel(keywordKey)
            setKeywordsList();
            adjustFrameSize();
            highlightKeywordComplete(keywordKey);
        }
    }

    function removeKeyword(keywordKey) {
        let id = `#kwhl-${keywordKey}-count`

        if (currentlyFocusedKeyword == keywordKey) {
            currentlyFocusedKeyword = undefined
            updateFocusedCounter()
            setFocusInBox()
            removeFocus()
        }

        if (isHighlighted[keywordKey]) {
            let top = document.documentElement.scrollTop;// Get current viewport position on page
            removeHighlight(keywordKey);
            window.scrollTo({ top: top, behavior: 'instant'});
            isHighlighted[keywordKey] = false;
        }

        keywords[keywordKey] = undefined;
        updateLabel(keywordKey)
        currentlyFocusedIndeces[keywordKey] = 0;

        updateMaxCount(keywordKey)
        setKeywordsList();
        adjustFrameSize();

        log(`keyword ${keywordKey} removed`);
    }

    function highlightPhd() {
        if (!isHighlighted.phd) {
            phdStrings.forEach((phdStr) => {
                if (ifStringExists(phdStr)){
                    let top = document.documentElement.scrollTop;// Get current viewport position on page

                    highlightString(phdStr, 'phd');

                    window.scrollTo({ top: top, behavior: 'instant' });// Return to original viewport position

                    if (document.querySelectorAll('.kwhl-phd').length < 1){
                        log('highlighting PhD not successful');
                    } else {
                        isHighlighted.phd = true
                        log('highlighted PhD');
                    }
                }
            })
            if (isHighlighted.phd) {
                let itemClass = '.kwhl-phd';
                let index = currentlyFocusedIndeces.phd
                //jump to index zero
                let viewHeight = Math.max(document.documentElement.clientHeight, window.innerHeight);
                let element = document.querySelectorAll(itemClass)[index]
                //remove focus
                removeFocus()
                //add focus
                element.classList.add('kwhl-focused');
                currentlyFocusedKeyword = 'phd';
                //update counter
                updateFocusedCounter()
                setFocusInBox()

                if (element.getBoundingClientRect().top < 70 || viewHeight - element.getBoundingClientRect().bottom < 70){
                    window.scrollTo({ top: (document.documentElement.scrollTop + element.getBoundingClientRect().top + -100), behavior: 'smooth'});
                }
            }
        }
    }


// Subsidiary functions
    function removeFocus() {
        let focused = document.querySelectorAll('.kwhl-focused')
        if (focused){
            focused.forEach((el) => {el.classList.remove("kwhl-focused")})
        }
    }


    function updateAllMaxCounts() {
        Object.keys(keywords).forEach((keywordKey) => updateMaxCount(keywordKey))
    }

    function updateMaxCount(keywordKey) {
        if (isBoxVisible) {
            if (keywordKey != 'phd') {
                let id = `#kwhl-${keywordKey}-count`
                let counter = keywordsList.querySelector(id)

                if (keywords[keywordKey]) {
                    let count = getKeywordCount(keywordKey)

                    counter.setAttribute('data-content', count);
                } else {
                    counter.setAttribute('data-content', '–');
                }
            }
        }
    }

    function updateFocusedCounter() {
        if (isBoxVisible) {
            iframeDocument.querySelectorAll('[data-counter]').forEach((el) => el.removeAttribute('data-counter'))
            if (currentlyFocusedKeyword != 'phd') {
                let id = `#kwhl-${currentlyFocusedKeyword}-count`
                let counter = keywordsList.querySelector(id)
                let index = currentlyFocusedIndeces[currentlyFocusedKeyword]

                if (currentlyFocusedKeyword) {
                    counter.setAttribute('data-counter', index + 1);
                }
            }
        }
    }

    function getKeywordCount(keywordKey){
        let classname = `.kwhl-${keywordKey}`;

        if (ifStringExists(keywords[keywordKey])){
            if (isHighlighted[keywordKey]){
                return document.querySelectorAll(classname).length;
            } else {// Count occurences of the keyword on the page using exactly the same method as highlightString() function
                let top = document.documentElement.scrollTop;// Get current viewport position on page
                let sel = window.getSelection();
                let count = 0

                if (window.find && window.getSelection) {
                    sel.collapse(document.body, 0);

                    while (window.find(keywords[keywordKey])) {
                        count++;
                    }
                }
                sel.collapseToEnd();
                window.scrollTo({ top: top, behavior: 'instant'});// Return to original viewport position

                return count
            }
        } else {
            return '0';
        }
    }

    function highlightString(text, keywordKey) {
        let sel = window.getSelection();

        if (window.find && window.getSelection) {
            sel.collapse(document.body, 0);

            while (window.find(text)) {
                let selection = window.getSelection().getRangeAt(0);
                let selectedText = selection.extractContents();

                if (selectedText.childNodes.length > 0){//workaround to not get stuck in google
                    let span = document.createElement("span");

                    span.classList.add('kwhl-' + keywordKey, 'kwhl-highlighted')
                    span.appendChild(selectedText);
                    selection.insertNode(span);
                }
            }
        }
        sel.collapseToEnd();
    }

    function removeHighlight(keywordKey){
        let keywordClass = '.kwhl-' + keywordKey
        while (!!document.querySelector(keywordClass)){
            let span = document.querySelector(keywordClass);
            let node = document.createRange().createContextualFragment(span.innerHTML);

            span.replaceWith(node);
        }
    }

// Update keyword label
    function updateLabel(keywordKey) {
        if (isBoxVisible) {
            let label = keywords[keywordKey]
            let id = `#kwhl-${keywordKey}-label`

            if (label !== undefined) {
                keywordsList.querySelector(id).setAttribute('data-content', label)
            } else {
                keywordsList.querySelector(id).setAttribute('data-content', '–')
            }
        }
    }
    function updateAllLabels() {
        keywordsList.querySelectorAll('li').forEach((row) => {updateLabel(row.id.split('-')[1])})
    }

// Checks if given string is present on the page
    function ifStringExists(string) {
        let top = document.documentElement.scrollTop;// Get current viewport position on page
        let sel = window.getSelection();
        sel.collapse(document.body, 0);
        if (window.find) {
            if (window.find(string)) {
                sel.collapseToEnd();
                window.scrollTo({ top: top, behavior: 'instant'});// Return to original viewport position

                return true
            }
        }
        window.scrollTo({ top: top, behavior: 'instant'});// Return to original viewport position

        return false
    }

    function blinkLabel(keywordKey){
        let el = keywordsList.querySelector(`#kwhl-${keywordKey}-label`);

        if (el.classList.contains('kwhl-blinkText')){
            el.classList.remove('kwhl-blinkText');
            void el.offsetWidth;
        }

        el.classList.add('kwhl-blinkText');
        setTimeout(() => el.classList.remove('kwhl-blinkText'), 800);

    }

    function setPhdButtonColor() {
        if (isBoxVisible) {
            let el = iframeDocument.querySelector('#kwhl-phd-label')

            if (el.classList.contains('skip-animation')){
                el.classList.remove('skip-animation')
            }

            if (isHighlighted.phd) {
                if (el.classList.contains('kwhl-blinkPhd')){
                    el.classList.remove('kwhl-blinkPhd')
                }
            } else {
                phdStrings.forEach((phdStr) => {
                    if (ifStringExists(phdStr)) {
                        if (el.classList.contains('kwhl-blinkPhd')){
                            el.classList.remove('kwhl-blinkPhd')
                        }

                        return
                    }
                })
                if (el.classList.contains('kwhl-blinkPhd')){
                    el.classList.remove('kwhl-blinkPhd')
                    void el.offsetWidth;
                }
                el.classList.add('kwhl-blinkPhd')
            }
        }
    }

    function setFocusInBox() {
        if (isBoxVisible) {
            if (currentlyFocusedKeyword){
                if (!iframeDocument.querySelector(`#kwhl-${currentlyFocusedKeyword}-label`).classList.contains('kwhlFocusedLabel')) {
                    removeFocusFromBox()
                    iframeDocument.querySelector(`#kwhl-${currentlyFocusedKeyword}-label`).classList.add('kwhlFocusedLabel')
                }
            } else {
                removeFocusFromBox()
            }
        }
    }
    function removeFocusFromBox(){
        if (isBoxVisible){
            let labels = iframeDocument.querySelectorAll('.kwhlFocusedLabel');
            labels.forEach((label) => {
                label.classList.remove('kwhlFocusedLabel');
            })
        }
    }

})();
