const siteBody = document.getElementById('body-id');
const colorSelect = document.getElementById('color-mode-select');

// Toggle and save: dark, red, purple, blue, green, yellow
if (typeof(Storage) !== 'undefined') {
    if (localStorage.quizmode) {
        switch (localStorage.quizmode) {
            case 'default':
                colorSelect.value = 'default';
                changeColorMode('default');
                break;
            case 'dark':
                colorSelect.value = 'dark';
                changeColorMode('dark');
                break;
            case 'red':
                colorSelect.value = 'red';
                changeColorMode('red');
                break;
            case 'purple':
                colorSelect.value = 'purple';
                changeColorMode('purple');
                break;
            case 'blue':
                colorSelect.value = 'blue';
                changeColorMode('blue');
                break;
            case 'green':
                colorSelect.value = 'green';
                changeColorMode('green');
                break;
            default:
                colorSelect.value = 'default';
                changeColorMode('default');
        }
    } else {
        changeColorMode('default');
    }
}

// Activate color mode
// color = str
function changeColorMode(color) {
    siteBody.classList = '';
    siteBody.classList.add(`${color}-mode`);
    if (typeof(Storage) !== 'undefined') {
        localStorage.quizmode = `${color}`;
    }
}
