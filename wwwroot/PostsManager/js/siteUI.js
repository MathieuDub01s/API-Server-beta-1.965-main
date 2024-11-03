//<span class="cmdIcon fa-solid fa-ellipsis-vertical"></span>
let contentScrollPosition = 0;
Init_UI();

function Init_UI() {
    renderPosts();
    $('#createPost').on("click", async function () {
        saveContentScrollPosition();
        renderCreatePostForm();
    });
    $('#abort').on("click", async function () {
        renderPosts();
    });
    $('#aboutCmd').on("click", function () {
        renderAbout();
    });
}

function renderAbout() {
    saveContentScrollPosition();
    eraseContent();
    $("#createPost").hide();
    $("#abort").show();
    $("#actionTitle").text("À propos...");
    $("#content").append(
        $(`
            <div class="aboutContainer">
                <h2>Gestionnaire de nouvelles</h2>
                <hr>
                <p>
                    Petite application de gestion de nouvelles à titre de démonstration
                    d'interface utilisateur monopage réactive.
                </p>
                <p>
                    Auteur: Nicolas Chourot, Mathieu Dubois, Rosalie Boyer
                </p>
                <p>
                    Collège Lionel-Groulx, automne 2024
                </p>
            </div>
        `))
}
async function renderPosts() {
    showWaitingGif();
    $("#actionTitle").text("Liste des nouvelle");
    $("#createPost").show();
    $("#abort").hide();
    let posts = await API_GetPosts();
    eraseContent();
    if (posts !== null) {
        posts.forEach(post => {
            $("#content").append(renderPost(post));
        });
        restoreContentScrollPosition();
        // Attached click events on command icons
        $(".editCmd").on("click", function () {
            saveContentScrollPosition();
            renderEditPostForm($(this).attr("editPostId"));
        });
        $(".deleteCmd").on("click", function () {
            saveContentScrollPosition();
            renderDeletePostForm($(this).attr("deletePostId"));
        });
        $(".contactRow").on("click", function (e) { e.preventDefault(); })
    } else {
        renderError("Service introuvable");
    }
}
function showWaitingGif() {
    eraseContent();
    $("#content").append($("<div class='waitingGifcontainer'><img class='waitingGif' src='Loading_icon.gif' /></div>'"));
}
function eraseContent() {
    $("#content").empty();
}
function saveContentScrollPosition() {
    contentScrollPosition = $("#content")[0].scrollTop;
}
function restoreContentScrollPosition() {
    $("#content")[0].scrollTop = contentScrollPosition;
}
function renderError(message) {
    eraseContent();
    $("#content").append(
        $(`
            <div class="errorContainer">
                ${message}
            </div>
        `)
    );
}
function renderCreatePostForm() {
    renderPostForm();
}
async function renderEditPostForm(id) {
    showWaitingGif();
    let post = await API_GetPost(id);
    if (post !== null)
        renderPostForm(post);
    else
        renderError("Post introuvable!");
}
async function renderDeletePostForm(id) {
    showWaitingGif();
    $("#createPost").hide();
    $("#abort").show();
    $("#actionTitle").text("Retrait");
    let post = await API_GetPost(id);
    eraseContent();
    if (post !== null) {
        $("#content").append(`
        <div class="postdeleteForm">
            <h4>Effacer la nouvelle suivante?</h4>
            <br>
            <div class="postRow" post_id=${post.Id}">
                <div class="postContainer">
                    <div class="postLayout">
                      <div class="postCategory">${post.Category}</div>
                        <div class="postTitle">${post.Title}</div>
                          <div class="postImage">${post.Image}</div>
                            <div class="postCreation">${post.Creation}</div>
                              <div class="postText">${post.Text}</div>
                    </div>
                </div>  
            </div>   
            <br>
            <input type="button" value="Effacer" id="deletePost" class="btn btn-primary">
            <input type="button" value="Annuler" id="cancel" class="btn btn-secondary">
        </div>    
        `);
        $('#deletePost').on("click", async function () {
            showWaitingGif();
            let result = await API_DeletePost(post.Id);
            if (result)
                renderPosts();
            else
                renderError("Une erreur est survenue!");
        });
        $('#cancel').on("click", function () {
            renderPosts();
        });
    } else {
        renderError("Post introuvable!");
    }
}
function newPost() {
    post = {};
    post.Id = 0;
    post.Title = "";
    post.Text = "";
    post.Category = "";
    post.Image = "";
    post.Creation = "";
    return post;
}
function renderPostForm(contact = null) {
    $("#createPost").hide();
    $("#abort").show();
    eraseContent();
    let create = post == null;
    if (create) {
        post = newContact();
        post.Image = "images/no-avatar.png";
    }
    $("#actionTitle").text(create ? "Création" : "Modification");
    $("#content").append(`
        <form class="form" id="postForm">
            <input type="hidden" name="Id" value="${post.Id}"/>

            <label for="Category" class="form-label">Category</label>
            <input 
                class="form-control Alpha"
                name="Category" 
                id="Category" 
                placeholder="Categorie"
                required
                RequireMessage="Veuillez entrer une categorie"
                InvalidMessage="La categorie comporte une caractère illégal" 
                value="${post.Category}"
            />
            <!-- nécessite le fichier javascript 'imageControl.js' -->
            <label class="form-label">Image</label>
            <div   class='imageUploader' 
                   newImage='${create}' 
                   controlId='Images' 
                   imageSrc='${post.Image}' 
                   waitingImage="Loading_icon.gif">
            </div>
            <hr>
            <input type="submit" value="Enregistrer" id="savePost" class="btn btn-primary">
            <input type="button" value="Annuler" id="cancel" class="btn btn-secondary">
        </form>
    `);
    initImageUploaders();
    initFormValidation(); // important do to after all html injection!
    $('#postForm').on("submit", async function (event) {
        event.preventDefault();
        let post = getFormData($("#postForm"));
        showWaitingGif();
        let result = await API_SavePost(post, create);
        if (result)
            renderPosts();
        else
            renderError("Une erreur est survenue! " + API_getcurrentHttpError());
    });
    $('#cancel').on("click", function () {
        renderPosts();
    });
}

function getFormData($form) {
    const removeTag = new RegExp("(<[a-zA-Z0-9]+>)|(</[a-zA-Z0-9]+>)", "g");
    var jsonObject = {};
    $.each($form.serializeArray(), (index, control) => {
        jsonObject[control.name] = control.value.replace(removeTag, "");
    });
    return jsonObject;
}

function renderPost(post) {
    return $(`
     <div class="postRow" post_id=${post.Id}">
        <div class="postContainer noselect">
            <div class="contactLayout">
                 <div class="avatar" style="background-image:url('${contact.Avatar}')"></div>
                 <div class="contactInfo">
                    <span class="contactName">${contact.Name}</span>
                    <span class="contactPhone">${contact.Phone}</span>
                    <a href="mailto:${contact.Email}" class="contactEmail" target="_blank" >${contact.Email}</a>
                </div>
            </div>
            <div class="contactCommandPanel">
                <span class="editCmd cmdIcon fa fa-pencil" editContactId="${contact.Id}" title="Modifier ${contact.Name}"></span>
                <span class="deleteCmd cmdIcon fa fa-trash" deleteContactId="${contact.Id}" title="Effacer ${contact.Name}"></span>
            </div>
        </div>
    </div>           
    `);
}