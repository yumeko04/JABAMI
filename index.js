var peer;
var myStream;
var videoElements = {}; // Stocker les vidéos pour éviter les doublons

// Fonction pour ajouter une vidéo à l'interface
function ajoutVideo(stream, id) {
    let existingVideo = document.getElementById(`video-${id}`);

    // Vérifier si la vidéo existe déjà pour cet utilisateur
    if (!existingVideo) {
        let video = document.createElement('video');
        video.id = `video-${id}`;
        video.srcObject = stream;
        video.autoplay = true;
        video.controls = true;
        document.getElementById('participants').appendChild(video);
        console.log(`Vidéo ajoutée pour l'utilisateur: ${id}`);
        
        videoElements[id] = video; // Stocke la vidéo pour éviter les doublons
    }
}

// Fonction d'enregistrement de l'utilisateur
function register() {
    var name = document.getElementById('name').value.trim();
    if (!name) {
        console.error("Nom requis.");
        return;
    }

    if (peer) {
        console.log("Une connexion Peer existe déjà.");
        return;
    }

    peer = new Peer(name);

    navigator.mediaDevices.getUserMedia({ video: true, audio: true })
        .then(stream => {
            myStream = stream;
            ajoutVideo(stream, "localVideo"); // Afficher la vidéo locale immédiatement

            document.getElementById('register').style.display = 'none';
            document.getElementById('userAdd').style.display = 'block';
            document.getElementById('userShare').style.display = 'block';

            // Gestion des appels entrants
            peer.on('call', function(call) {
                call.answer(myStream);
                call.on('stream', function(remoteStream) {
                    ajoutVideo(remoteStream, call.peer); // Affiche la vidéo de l'invité
                });
                call.on('error', function(err) {
                    console.error("Erreur lors de l'appel :", err);
                });
            });

        }).catch(err => {
            console.error("Échec d'accès au flux vidéo/audio :", err);
        });
}

// Fonction pour appeler un utilisateur
function appelUser() {
    var name = document.getElementById('add').value.trim();
    if (!name) {
        console.error("Nom de l'utilisateur requis.");
        return;
    }
    document.getElementById('add').value = "";

    var call = peer.call(name, myStream);

    call.on('stream', function(remoteStream) {
        ajoutVideo(remoteStream, call.peer);
    });

    call.on('error', function(err) {
        console.error("Erreur d'appel :", err);
    });
}

// Fonction pour partager l'écran
function addScreenShare() {
    var name = document.getElementById('share').value.trim();
    if (!name) {
        console.error("Nom de l'utilisateur requis.");
        return;
    }
    document.getElementById('share').value = "";

    navigator.mediaDevices.getDisplayMedia({ video: { cursor: "always" }, audio: true })
        .then(stream => {
            let call = peer.call(name, stream);

            ajoutVideo(stream, "screenShare");

            call.on('error', function(err) {
                console.error("Erreur de partage d'écran :", err);
            });

            // Revenir à la caméra après le partage d'écran
            stream.getVideoTracks()[0].onended = function() {
                navigator.mediaDevices.getUserMedia({ video: true, audio: true })
                    .then(newStream => {
                        myStream = newStream;
                        ajoutVideo(newStream, "localVideo");
                    })
                    .catch(err => console.error("Impossible de récupérer la caméra :", err));
            };
        })
        .catch(error => console.error("Erreur lors du partage d'écran :", error));
}