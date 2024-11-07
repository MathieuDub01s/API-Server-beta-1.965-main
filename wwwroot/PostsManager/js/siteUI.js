let search = "";
let endOfData = false;
let pageManager;
Init_UI();

function Init_UI() {
    $('#aboutContainer').hide();
    let postItemLayout = {
        width: $("#sample").outerWidth(),
        height: $("#sample").outerHeight()
    };
    pageManager = new PageManager('scrollPanel', 'postsPanel', postItemLayout, renderPosts);
    $("#actionTitle").text("Nouvelles");
    $("#search").show();
    $("#abort").hide();
    $("#errorContainer").hide();

    $('#abort').on("click", async function () {
        eraseContent();
        $("#aboutContainer").hide();
        $("#errorContainer").hide();
        $("#abort").hide();
        $("#search").show();
        $("#scrollPanel").show();        
        $("#createPost").show();
        $("#actionTitle").text("Nouvelles");
        $("#content").append(
            $(`
            <div id="scrollPanel">
                <div id="postsPanel" class="postsContainer">
       
                </div>
            </div>
            `)
        );
    
        renderPosts();
    });
    $('#aboutCmd').on("click", function () {
        renderAbout();
    });
    $("#searchKey").on("change", () => {
        doSearch();
    })
    $('#doSearch').on('click', () => {
        doSearch();
    })
    $('#createPost').on("click", async function () {
        saveContentScrollPosition();
        renderPostForm();
    });
}
function doSearch() {
    search = $("#searchKey").val().replace(' ', ',');
    pageManager.reset();
}
function saveContentScrollPosition() {
    contentScrollPosition = $("#content")[0].scrollTop;
}
function renderAbout() {
    $("#scrollPanel").hide();
    $("#abort").show();
    $("#search").hide();
    $("#actionTitle").text("À propos...");
    $("#aboutContainer").show();
}
function renderError(message) {
    removeWaitingGif();
    $("#scrollPanel").hide();
    $("#abort").show();
    $("#search").hide();
    $("#actionTitle").text("Erreur du serveur...");
    $("#errorContainer").show();
    $("#errorContainer").empty();
    $("#errorContainer").append(
        $(`
            <span class="errorContainer">
                ${message}
            </span>
        `)
    );
}
async function renderPosts(queryString) {
    if (search != "") queryString += "&keywords=" + search;
    addWaitingGif();
    let posts = await API.getPosts(queryString);
    if (API.error)
        renderError(API.currentHttpError);
    else
        if (posts.length > 0) {

            posts.forEach(post => {
                $("#postsPanel").append(renderPost(post));
            });
        }
    removeWaitingGif();
}
function addWaitingGif() {
    $("#postsPanel").append($("<div id='waitingGif' class='waitingGifcontainer'><img class='waitingGif' src='Loading_icon.gif' /></div>'"));
}
function removeWaitingGif() {
    $("#waitingGif").remove('');
}
function eraseContent() {
    $("#content").empty();
}
function newPost() {
    post = {};
    post.Id = 0;
    post.Title = "";
    post.Category = "";
    post.Text = "";
    post.Creation = "";
    return post;
}
function renderPostForm(post = null) {
    $("#createPost").hide();
    $("#abort").show();
    eraseContent();
    let create = post == null;
    if (create) {
        post = newPost();
        post.Image = "images/default_news.png";
    }
    $("#actionTitle").text(create ? "Création" : "Modification");
    $("#content").append(`
        <form class="form" id="PostForm">
            <input type="hidden" name="Id" value="${post.Id}}"/>

            <label for="Title" class="form-label">Titre </label>
            <input 
                class="form-control Alpha"
                name="Title" 
                id="Title" 
                placeholder="Titre"
                required
                RequireMessage="Veuillez entrer un titre"
                InvalidMessage="Le nom comporte un caractère illégal" 
                value="${post.Title}"
            />
            <label for="Text" class="form-label">Texte </label>
            <textarea
                class="form-control Alpha"
                name="Text" 
                id="Text" 
                placeholder="Texte"
                required
                RequireMessage="Veuillez entrer un texte"
                InvalidMessage="Le texte comporte un caractère illégal" 
                value="${post.Text}"
            /></textarea>
            <label for="Category" class="form-label">Catégorie </label>
            <input 
                class="form-control Alpha"
                name="Category" 
                id="Category"
                placeholder="Catégorie"
                required
                RequireMessage="Veuillez entrer une catégorie"
                InvalidMessage="La catégorie comporte un caractère illégal" 
                value="${post.Category}"
            />
            <label for="Creation" class="form-label">Création </label>
            <input 
                class="form-control Alpha"
                type="date"
                name="Creation" 
                id="Creation 
                placeholder="Creation"
                required
                RequireMessage="Veuillez entrer une date"
                InvalidMessage="La date comporte un caractère illégal" 
                value="${post.Creation}"
            />
            <!-- nécessite le fichier javascript 'imageControl.js' -->
            <label class="form-label">Image </label>
            <div   class='imageUploader' 
                   newImage='${create}' 
                   controlId='Avatar' 
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
    $('#contactForm').on("submit", async function (event) {
        event.preventDefault();
        let contact = getFormData($("#contactForm"));
        showWaitingGif();
        let result = await API_SaveContact(contact, create);
        if (result)
            renderContacts();
        else
            renderError("Une erreur est survenue! " + API_getcurrentHttpError());
    });
    $('#cancel').on("click", function () {
        renderContacts();
    });
}
function renderPost(post) {
    let date = convertToFrenchDate(post.Creation); 
    return $(`
     <div class="postRow" post_id=${post.Id}">
        <div class="postContainer noselect">
            <div class="postLayout">
                <div class="postInfo">
                    <span class="postCategory">${post.Category}</span>
                    <div class="postCommandPanel">
                        <span class="editCmd cmdIcon fa-solid fa-square-pen" editPostId="${post.Id}" title="Modifier ${post.Title}"></span>
                        <span class="deleteCmd cmdIcon fa-solid fa-square-xmark" deletePostId="${post.Id}" title="Effacer ${post.Title}"></span>
                    </div>   
                </div>
                <div class="postTitle">${post.Title}
                <div class="postImage" style="background-image:url('${post.Image}')"></div>
                <span class="postDate">${date}</span>
                <div class="postText">${post.Text}</div>
            </div>
        </div>
    </div> 
         
    `);
}
function convertToFrenchDate(numeric_date) {
    date = new Date(numeric_date);
    var options = { year: 'numeric', month: 'long', day: 'numeric' };
    var opt_weekday = { weekday: 'long' };
    var weekday = toTitleCase(date.toLocaleDateString("fr-FR", opt_weekday));

    function toTitleCase(str) {
        return str.replace(
            /\w\S*/g,
            function (txt) {
                return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase();
            }
        );
    }
    return weekday + " le " + date.toLocaleDateString("fr-FR", options) + " @ " + date.toLocaleTimeString("fr-FR");
}