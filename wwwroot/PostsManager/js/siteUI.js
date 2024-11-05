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
        $("#aboutContainer").hide();
        $("#errorContainer").hide();
        $("#abort").hide();
        $("#search").show();
        $("#scrollPanel").show();
        $("#actionTitle").text("Nouvelles");
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
}
function doSearch() {
    search = $("#searchKey").val().replace(' ', ',');
    pageManager.reset();
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
    $("#postPanel").append($("<div id='waitingGif' class='waitingGifcontainer'><img class='waitingGif' src='Loading_icon.gif' /></div>'"));
}
function removeWaitingGif() {
    $("#waitingGif").remove('');
}
function renderPost(post) {
    return $(`
     <div class="postRow" post_id=${post.Id}">
        <div class="postContainer ">
            <div class="postLayout">
             <span class="postCategory">${post.Category}</span>
                <div class="postTitle">${post.Title}</div>
                <div class="postImage" style="background-image:url('${post.Image}')"></div>
                <span class="postDate">${post.Creation}</span>
                <div class="postText">${post.Text}</div>
            </div>
            <div class="postCommandPanel">
                <span class="editCmd cmdIcon fa-solid fa-square-pen" editPostId="${post.Id}" title="Modifier ${post.Title}"></span>
                <span class="deleteCmd cmdIcon fa-solid fa-square-xmark" deletePostId="${post.Id}" title="Effacer ${post.Title}"></span>
            </div>   
        </div>
    </div>       
    `);
}