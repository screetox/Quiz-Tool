const soundSelect = document.getElementById('sound-mode-select');

// Toggle and save: dark, red, purple, blue, green, yellow
if (typeof(Storage) !== 'undefined') {
    var sound = '';
    if (localStorage.soundmode) {
        switch (localStorage.soundmode) {
            case 'buzzer':
                soundSelect.value = 'buzzer';
                break;
            case 'bonk':
                soundSelect.value = 'bonk';
                break;
            case 'idea':
                soundSelect.value = 'idea';
                break;
            case 'surprise':
                soundSelect.value = 'surprise';
                break;
            case 'windows-error':
                soundSelect.value = 'windows-error';
                break;
            default:
                soundSelect.value = 'buzzer';
                break;
        }
        sound = soundSelect.value;
        audio = new Audio(`/mp3/${sound}.mp3`);
    } else {
        sound = 'buzzer';
        audio = new Audio(`/mp3/${sound}.mp3`);
    }
}

// Activate sound mode
// sound = str
function changeSoundMode(sound) {
    audio = new Audio(`/mp3/${sound}.mp3`);
    audio.play();
    if (typeof(Storage) !== 'undefined') {
        localStorage.soundmode = `${sound}`;
    }
}