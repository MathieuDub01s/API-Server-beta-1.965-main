const periodicRefreshPeriod = 10;
let categories = [];
let selectedCategory = "";
let currentETag = "";
let hold_Periodic_Refresh = false;
let pageManager;
let waitingGifTrigger = 2000;
let waiting = null;

function addWaitingGif() {
    clearTimeout(waiting);
    waiting = setTimeout(() => {
        $("#itemsPanel").append($("<div id='waitingGif' class='waitingGifcontainer'><img class='waitingGif' src='Loading_icon.gif' /></div>'"));
    }, waitingGifTrigger)
}
function removeWaitingGif() {
    clearTimeout(waiting);
    $("#waitingGif").remove('');
}

Init_UI();

async function Init_UI() {
    let itemLayout = {
        width: $("#sample").outerWidth(),
        height: $("#sample").outerHeight()
    };
    pageManager = new PageManager('scrollPanel', 'itemsPanel', itemLayout, renderPosts);
    compileCategories();
    $('#createPost').on("click", async function () {
        renderCreatePostForm();
    });
    $('#abort').on("click", async function () {
        showPosts();
    });
    $('#aboutCmd').on("click", function () {
        renderAbout();
    });
    showPosts();
    $("#postForm").hide();
    $("#aboutContainer").hide();
    start_Periodic_Refresh();
}
function showPosts() {
    $("#actionTitle").text("Nouvelles");
    $("#scrollPanel").show();
    $('#abort').hide();
    $('#postForm').hide();
    $('#aboutContainer').hide();
    $("#createPost").show();
    hold_Periodic_Refresh = false;
}
function hidePosts() {
    $("#scrollPanel").hide();
    $("#createPost").hide();
    $("#abort").show();
    hold_Periodic_Refresh = true;
}
function start_Periodic_Refresh() {
    setInterval(async () => {
        if (!hold_Periodic_Refresh) {
            let etag = await Posts_API.HEAD();
            if (currentETag != etag) {
                currentETag = etag;
                pageManager.update(false);
                compileCategories();
            }
        }
    },
        periodicRefreshPeriod * 1000);
}
function renderAbout() {
    $("#scrollPanel").hide();
    $("#abort").show();
    $("#search").hide();
    $("#actionTitle").text("À propos...");
    $("#aboutContainer").show();
    hidePosts();
    $("#actionTitle").text("À propos...");
    $("#aboutContainer").show();
}
function updateDropDownMenu() {
    let DDMenu = $("#DDMenu");
    let selectClass = selectedCategory === "" ? "fa-check" : "fa-fw";
    DDMenu.empty();
    DDMenu.append($(`
        <div class="dropdown-item menuItemLayout" id="allCatCmd">
            <i class="menuIcon fa ${selectClass} mx-2"></i> Toutes les catégories
        </div>
        `));
    DDMenu.append($(`<div class="dropdown-divider"></div>`));
    categories.forEach(category => {
        selectClass = selectedCategory === category ? "fa-check" : "fa-fw";
        DDMenu.append($(`
            <div class="dropdown-item menuItemLayout category" id="allCatCmd">
                <i class="menuIcon fa ${selectClass} mx-2"></i> ${category}
            </div>
        `));
    })
    DDMenu.append($(`<div class="dropdown-divider"></div> `));
    DDMenu.append($(`
        <div class="dropdown-item menuItemLayout" id="aboutCmd">
            <i class="menuIcon fa fa-info-circle mx-2"></i> À propos...
        </div>
        `));
    $('#aboutCmd').on("click", function () {
        renderAbout();
    });
    $('#allCatCmd').on("click", function () {
        showPosts();
        selectedCategory = "";
        updateDropDownMenu();
        pageManager.reset();
    });
    $('.category').on("click", function () {
        showPosts();
        selectedCategory = $(this).text().trim();
        updateDropDownMenu();
        pageManager.reset();
    });
}
async function compileCategories() {
    categories = [];
    let response = await Posts_API.GetQuery("?fields=category&sort=category");
    if (!Posts_API.error) {
        let items = response.data;
        if (items != null) {
            items.forEach(item => {
                if (!categories.includes(item.Category))
                    categories.push(item.Category);
            })
            updateDropDownMenu(categories);
        }
    }
}
async function renderPosts(queryString) {
    let endOfData = false;
    queryString += "&sort=category";
    if (selectedCategory != "") queryString += "&category=" + selectedCategory;
    addWaitingGif();
    let response = await Posts_API.Get(queryString);
    if (!Posts_API.error) {
        currentETag = response.ETag;
        let Posts = response.data;
        if (Posts.length > 0) {
            Posts.forEach(Post => {
                $("#itemsPanel").append(renderPost(Post));
            });
            $(".editCmd").off();
            $(".editCmd").on("click", function () {
                renderEditPostForm($(this).attr("editPostId"));
            });
            $(".deleteCmd").off();
            $(".deleteCmd").on("click", function () {
                renderDeletePostForm($(this).attr("deletePostId"));
            });
            $('#moreText').on("click", function () {
                textMaxCaracters = textWithBack;
                console.log("hhelo");
            });
        } else
            endOfData = true;
    } else {
        renderError(Posts_API.currentHttpError);
    }
    removeWaitingGif();
    return endOfData;
}

function renderError(message) {
    hidePosts();
    $("#actionTitle").text("Erreur du serveur...");
    $("#errorContainer").show();
    $("#errorContainer").append($(`<div>${message}</div>`));
}
function renderCreatePostForm() {
    renderPostForm();
}
async function renderEditPostForm(id) {
    addWaitingGif();
    let response = await Posts_API.Get(id)
    if (!Posts_API.error) {
        let Post = response.data;
        console.log(response.data);
        if (Post !== null)
            renderPostForm(Post);
        else
            renderError("Post introuvable!");
    } else {
        renderError(Posts_API.currentHttpError);
    }
    removeWaitingGif();
}
async function renderDeletePostForm(id) {
    hidePosts();
    $("#actionTitle").text("Retrait");
    $('#postForm').show();
    $('#postForm').empty();
    let response = await Posts_API.Get(id)
    if (!Posts_API.error) {
        let Post = response.data;
      
        if (Post !== null) {
            $("#postForm").append(`
        <div class="PostdeleteForm">
            <h4>Effacer le favori suivant?</h4>
            <br>
            <div class="PostRow" id=${Post.Id}">
                <div class="PostContainer noselect">
                    <div class="PostLayout">
                        <div class="Post">
                           
                            <span class="PostTitle">${Post.Title}</span>
                        </div>
                        <span class="PostCategory">${Post.Category}</span>
                    </div>
                    <div class="PostCommandPanel">
                        <span class="editCmd cmdIcon fa fa-pencil" editPostId="${Post.Id}" title="Modifier ${Post.Title}"></span>
                        <span class="deleteCmd cmdIcon fa fa-trash" deletePostId="${Post.Id}" title="Effacer ${Post.Title}"></span>
                    </div>
                </div>
            </div>   
            <br>
            <input type="button" value="Effacer" id="deletePost" class="btn btn-primary">
            <input type="button" value="Annuler" id="cancel" class="btn btn-secondary">
        </div>    
        `);
            $('#deletePost').on("click", async function () {
                await Posts_API.Delete(Post.Id);
                if (!Posts_API.error) {
                    showPosts();
                    pageManager.update(false);
                    compileCategories();
                }
                else {
                    console.log(Posts_API.currentHttpError)
                    renderError("Une erreur est survenue!");
                }
            });
            $('#cancel').on("click", function () {
                showPosts();
            });

        } else {
            renderError("Post introuvable!");
        }
    } else
        renderError(Posts_API.currentHttpError);
}
function getFormData($form) {
    const removeTag = new RegExp("(<[a-zA-Z0-9]+>)|(</[a-zA-Z0-9]+>)", "g");
    var jsonObject = {};
    $.each($form.serializeArray(), (index, control) => {
        jsonObject[control.name] = control.value.replace(removeTag, "");
    });
    return jsonObject;
}
function newPost() {
    post = {};
    post.Id = 0;
    post.Title = "";
    post.Category = "";
    post.Text = "";
    post.Creation = Date.now();
    return post;
}

//RENDER POST   
function renderPostForm(Post = null) {
    hidePosts();
    let create = Post == null;
    //let favicon = `<div class="big-favicon"></div>`;
    if (create){
        Post = newPost();
        Post.Image = "images/default_news.png";
    }
    $("#actionTitle").text(create ? "Création" : "Modification");
    $("#postForm").show();
    $("#postForm").empty();
    $("#postForm").append(`
           <form class="form" id="PostForm">
            <input type="hidden" name="Id" value="${Post.Id}"/>
            <label for="Title" class="form-label">Titre </label>
            <input 
                class="form-control Alpha"
                name="Title" 
                id="Title" 
                placeholder="Titre"
                required
                RequireMessage="Veuillez entrer un titre"
                InvalidMessage="Le nom comporte un caractère illégal" 
                value="${Post.Title}"
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
                value="${Post.Text}"
            />${Post.Text}</textarea>
            <label for="Category" class="form-label">Catégorie </label>
            <input 
                class="form-control Alpha"
                name="Category" 
                id="Category"
                placeholder="Catégorie"
                required
                RequireMessage="Veuillez entrer une catégorie"
                InvalidMessage="La catégorie comporte un caractère illégal" 
                value="${Post.Category}"
            />
           
            <!-- nécessite le fichier javascript 'imageControl.js' -->
            <label class="form-label">Image </label>
             <div   class='imageUploaderContainer' >
            <div   class='imageUploader' 
                   newImage='${create}' 
                   controlId='Image' 
                   imageSrc='${Post.Image}' 
                   waitingImage="Loading_icon.gif">
                   
            </div>
            </div>
            <hr>
            <input type="submit" value="Enregistrer" id="savePost" class="btn btn-primary">
            <input type="button" value="Annuler" id="cancel" class="btn btn-secondary">
        </form>
    `);
    initImageUploaders();
   
    $('#PostForm').on("submit", async function (event) {
        event.preventDefault();
        let post = getFormData($("#PostForm"));
        post = await Posts_API.Save(post, create);
        if (!Posts_API.error) {
            showPosts();
            await pageManager.update(false);
            compileCategories();
            let b = $("#post_" + post.Id);
            console.log(b, b.offset().top);
            $("#scrollPanel").scrollTop(b.offset().top);
        }
        else
            renderError("Une erreur est survenue!");
    });
    $('#cancel').on("click", function () {
        showPosts();
    });
   /* $('#postForm').on("submit", async function (event) {
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
    });*/

}


//RENDER POST
function renderPost(post) {
    let date = convertToFrenchDate(post.Creation); 
    let textWithBack = post.Text.replace("\r\n\r\n", "<br>");
    let textMaxCaracters = textWithBack.substring(0,200);
    let textRest = textWithBack.substring(200);
    let allText = `${textMaxCaracters}<span id="dots-${post.Id}">...</span><span id="more-${post.Id}" style="display:none;">${textRest}</span>`;
    //let allText = `${textMaxCaracters}<span id="more-${post.Id}" style="display:none;">${textRest}</span>`;

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
                <div class="postTitle">${post.Title}</div>
                <div class="postImage" style="background-image:url('${post.Image}')"></div>
                <span class="postDate">${date}</span>
                <div class="postText">${allText}</div>
            </div>
        </div>
    </div> 
    <hr>
    <div class="moreTextDiv">
        <i title="Voir plus"class="cmdIcon fa fa-angle-double-down moreTextIcon" data-id="${post.Id}">
    <div>
         
    `);
    
    
}
$(document).on("click", ".moreTextIcon", function () {
    console.log("click");
    let postId = $(this).data("id");
    $(`#dots-${postId}`).toggle();
    $(`#more-${postId}`).toggle();

    $(this).toggleClass("fa-angle-double-down fa-angle-double-up");
});

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
