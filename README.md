# Keywords Highlighter

### Simple keywords and PhD highlighter that works on every web page

Install using Tampermonkey or other userscript manager of your choice:  
https://github.com/FalseSunrise/Keywords_Highlighter/raw/refs/heads/main/Keywords_Highlighter.user.js

## Description

This tool can store up to 6 keywords and highlight them at the opened page similarly to the default browser's search tool (Ctrl + f). Additionally, it finds and highlights the following PhD-like strings in multiple languages:
- "PhD", "Ph.D", "Ph. D", "Dr ", "Dr.", "Dr. rer. nat.", "Doctorate", "Doctor", "DSc", "D.Sc", "Doctor of Philosophy", "CSc.", 
- "кандидат наук", "к.и.н", "доктор наук", "д.н", "доктор", "Кандидат технических наук", 
- "博士", "dottore".
  
## Usage

Keywords are highlighted with distinct colours, and the currently focused keyword is outlined with a bright magenta box. You can jump to the next found keyword using a button or keyboard shortcut.

![407377529-40be3a27-9d85-4d97-a500-258b3c935209](https://github.com/user-attachments/assets/01e11b05-9e23-457d-a05e-0701752704bf)

The draggable box interface lets you quickly check if a given keyword is present on the page and its count. You can drag the box by grabbing the "Keywords" title. It also includes buttons that let you manipulate stored keywords and navigate through the highlights.

![407373025-986df64d-dcc2-4865-9dec-705e2acc0f05](https://github.com/user-attachments/assets/cc7e094f-b6cf-4f7b-baba-0c87ff887c8b)

You can also use shortcuts to perform actions faster:  
- All shortcuts consist of pressing a combination of Alt (Win, Ctrl) and a corresponding Numpad number (1-6),
- To show or hide the box interface, press Alt + Numpad 7,
- To show highlight all keywords simultaneously, press Alt + Numpad 8,
- To highlight PhD, press Alt + Numpad 9.

If you use shortcuts, you can hide parts of the interface to make the box smaller.
- "⟩" and ⟨ hide circle buttons,
- "︿" hides not used keywords.

![image](https://github.com/user-attachments/assets/6cf9e19d-61e9-4521-ac12-2bb6a0e7b896)

## Full list of actions

| Action                     | Box                                | Shortcut                                |
|----------------------------|------------------------------------|-----------------------------------------|
| Show/hide box interface    | –                                  | Alt + Numpad 7                          |
| Add/replace stored keyword | "+" button                         | Alt + Win + Numpad 1-6                  |
| Remove stored keyword      | "x" button                         | Alt + Win + Ctrl + Numpad 1-6           |
| Highlight keyword          | Click keyword label                | Alt + Numpad 1-6 (when not highlighted) |
| Unhighlight keyword        | Click keyword label (when focused) | Alt + Ctrl + Numpad 1-6                 |
| Jump to next highlight     | "Arrow down" button                | Alt + Numpad 1-6 (when highlighted)     |
| Jump to previous highlight | "Arrow up" button                  | –                                       |
| Highlight PhD              | Click "PhD" Label                  | Alt + Numpad 9                          |
| Unhighlight PhD            | –                                  | Alt + Ctrl + Numpad 9                   |
| Highlight all keywords     | –                                  | Alt + Numpad 8                          |
| Unhighlight all keywords   | –                                  | Alt + Ctrl + Numpad 8                   |
| Remove all stored keywords | –                                  | Alt + Win + Ctrl + 8                    |

## Quick install

- Get Tampermonkey extension for your browser:<br>
https://www.tampermonkey.net/

- Click the link below and let Tampermonkey install the script:<br>
https://github.com/FalseSunrise/Keywords_Highlighter/raw/refs/heads/main/Keywords_Highlighter.user.js

- Make sure the script is enabled in Tampermonkey:<br>
![image](https://github.com/user-attachments/assets/3a1a2e9a-2fa9-4ff4-aab2-8a9b0288c490)

- If the box interface is not visible press Alt + Numpad 7.
