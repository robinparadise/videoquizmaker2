/* This Source Code Form is subject to the terms of the MIT license
 * If a copy of the MIT license was not distributed with this file, you can
 * obtain one at http://www.mozillapopcorn.org/butter-license.txt */

define([ "text!dialog/dialogs/quizme.html", "dialog/dialog", "util/scrollbars", "util/xhr" ],
  function( LAYOUT_SRC, Dialog, Scrollbars, XHR ) {

  Dialog.register( "quizme", LAYOUT_SRC, function( dialog ) {

    var rootElement       = dialog.rootElement,
        quizzes           = rootElement.querySelector( ".quizzes" ),
        questions         = rootElement.querySelector( ".questions" ),
        selectTypeAns     = rootElement.querySelector( ".select-type-answer" ),
        questionInput     = rootElement.querySelector( ".question-input" ),
        addUpdateQues     = rootElement.querySelector( ".add-update-question" ),
        $rootElement      = $( rootElement ),
        $quizzes          = $( quizzes ),
        $questions        = $( questions ),
        $selectTypeAns    = $( selectTypeAns ),
        $addUpdateQues    = $( addUpdateQues ),
        $answers          = $rootElement.find( ".answer" ),
        $deleteQues       = $rootElement.find( ".delete-question" ),
        $addQuestion      = $rootElement.find( ".add-question" ),
        $addQuiz          = $rootElement.find( ".add-quiz" ),
        $deleteQuiz       = $rootElement.find( ".delete-quiz" ),
        $inputNewQuiz     = $rootElement.find( ".add-new-quiz" ),
        $quizzesContainer = $rootElement.find( "#list-quizzes" ),
        $importQuiz       = $rootElement.find( "#import-quiz" ),
        $exportQuiz       = $rootElement.find( ".export-quiz" ),
        $spinnerWrap      = $rootElement.find( "#spinner-wrapper" ),
        $error            = $rootElement.find( ".error-quizmanager" ),
        GlobalQuiz        = this.Butter.QuizOptions,
        TempDataQuiz;

    // Save and Close (on variable Butter.QuizOptions)
    var saveAndClose = function () {
        $(window).off("resize", updateScrollbar);
        Butter.app.deselectAllTrackEvents();
        this.Popcorn.manifest.quizme.options.name.options = Object.keys(GlobalQuiz);
    }
    dialog.registerActivity( "close", function( e ) {
        saveAndClose();
    });
    dialog.assignButton( ".close-button", "close" );
    dialog.enableCloseButton();

    // Animation Pulse, Delete
    (function($) {
        $.fn.fancyAnimate = function(options, callback) {
            if (!options) options = {};
            if (!options.duration) options.duration  = 510;
            if (options.mode === "add") {
                options.attrClass = "pulse focus-light animated-half";
            } else if (options.mode === "update" || options.mode === "update all") {
                options.attrClass = "pulse animated-half";
            } else if (options.mode === "delete") {
                options.attrClass = "pulse animated-half";
            } else if (options.mode === "focus-red") {
                options.attrClass = "focus-red";
            } else if (options.mode === "error") {
                options.attrClass = "pulse animated-half";
                options.duration = 3000;
            } else { // default
                options.duration  = 1100;
                options.attrClass = "pulse focus-red animated-one";
            }
            return $(this).each(function() {
                var $that = $(this);
                $that.addClass(options.attrClass);
                setTimeout(function() {
                    $that.removeClass(options.attrClass);
                    !!callback && callback();
                }, options.duration);
            });
        }
    })(jQuery);


    var appendToList = function($list, text, attrs, action) {
        var focus, $elem;

        if (action === "add") { // Create element, Append last and Animate
            focus = !!( $elem = $(document.createElement( "li" )) );
        }
        else if (action === "update") { // Update selected and Animate
            focus = !!( $elem = $list.find(".selected") );
        }
        else if (action && action.animate === "update all") {
            $elem = $(document.createElement( "li" ));
            if (attrs[action.attr] === action.question) { // Then animate and select
                focus = !!( $elem.addClass("selected") );
            }
        }
        else { // else just append element
            $elem = $(document.createElement( "li" ));
        }

        $elem.text(text);
        $.each(attrs, function(name, value) {
            $elem.attr(name, value); // attributes
        });
        action !== "update" && $list.append($elem);
        focus  === true     && $elem.fancyAnimate({mode:action});
    }

    var addScrollbar = function( scrollbarContainer, place ) {
        var scrollbarInner = scrollbarContainer.querySelector( ".scrollbar-inner" );
        var scrollbarOuter = scrollbarContainer.querySelector( ".scrollbar-outer" );

        var options = options || scrollbarInner && {
            inner: scrollbarInner,
            outer: scrollbarOuter || scrollbarInner.parentNode,
            appendTo: scrollbarContainer || rootElement
        };
        if ( !options ) return;

        dialog[place] = new Scrollbars.Vertical( options.outer, options.inner );
        options.appendTo.appendChild( dialog[place].element );

        dialog[place].update();

        return dialog[place];
    };

    var stripBlanks = function (field) {
        var result = "";
        var c = 0;
        for (var i=0; i < field.length; i++) {
            if (field.charAt(i) != " " || c > 0) {
                result += field.charAt(i);
                if (field.charAt(i) != " ") {
                    c = result.length;
                }
            }
        }
        return result.substr(0,c);
    }

    var getNewQuizName = function(name, obj) {
        var newname = name, i = 0;
        if (!obj) {
            while(!!GlobalQuiz[newname]) {
                newname = name + " (" + ++i + ")";
            }
        }
        else { // obj: avoid confict with the obj too
            while(!!GlobalQuiz[newname] || !!obj[newname]) {
                newname = name + " (" + ++i + ")";
            }
        }
        return newname;
    }

    var manager = {
        importQuizzes: function(data) {
            TempDataQuiz = {
                "#action#": {animate: "newQuizzes"},
                quizzes: {}
            };
            var importedQuiz;
            Object.keys(data).forEach(function(name) {
                importedQuiz = $.extend({}, data[name]);
                if (!!GlobalQuiz[name]) { // The name of the quiz exists
                    // get new name of quiz
                    var importedName = getNewQuizName(name, data); // avoid confict with the obj data too
                    TempDataQuiz.quizzes[importedName] = importedQuiz; // Save
                    $spinnerWrap.show();
                    quizDB.savequiz(importedName, importedQuiz, manager.receiveQuizzes);
                } else {
                    TempDataQuiz.quizzes[name] = importedQuiz; // Save
                    $spinnerWrap.show();
                    quizDB.savequiz(name, importedQuiz, manager.receiveQuizzes);
                }
            });
        },
        receiveQuizzes: function(data) {
            var action;
            !!TempDataQuiz && !!( action = TempDataQuiz["#action#"].animate );
            if (!data) {
                console.log({ error: "[addQuizzes]: an unknown error occured" });
            }
            else if (data.error === "unauthorized") {
                dialog.activity( "default-close" );
                dialog = Dialog.spawn( "unauthorized" ).open();
            }
            else if (data.error && data.error !== "okay") {
                console.log(data.error);
            }
            // Delete Quiz
            else if (action === "delete") {
                var name = TempDataQuiz["#action#"].name;
                TempDataQuiz = undefined;
                delete GlobalQuiz[name];
                $quizzes.find("[quizname='"+name+"']").fadeOut("slow", function() {
                    $(this).remove();
                });
            }
            // Change name of Quiz
            else if (action === "changeNameQuiz") {
                var newname = TempDataQuiz["#action#"].newname;
                var oldname = TempDataQuiz["#action#"].oldname;
                TempDataQuiz = undefined;
                GlobalQuiz[newname] = GlobalQuiz[oldname];
                delete GlobalQuiz[oldname];
                $quizzes.find(".selected").text(newname).attr("quizname", newname);
            }
            // Add empty new Quiz
            else if (action === "newQuiz") { // new Quiz
                var name = TempDataQuiz["#action#"].newname;
                TempDataQuiz = undefined;
                if (!GlobalQuiz[name]) {
                    GlobalQuiz[name] = new Object();
                }
                appendToList($quizzes, name, { // append just this one
                    "quizname": name,
                    "quizid": data.id
                });
                $inputNewQuiz.val("");
            }
            // Add new Quizzes
            else if (action === "newQuizzes") { // new Quiz
                if (!GlobalQuiz[data.name]) {
                    GlobalQuiz[data.name] = new Object();
                }
                GlobalQuiz[data.name] = $.extend({}, TempDataQuiz.quizzes[data.name]); // Save
                delete TempDataQuiz.quizzes[data.name];
                if ($.isEmptyObject(TempDataQuiz.quizzes)) {
                    TempDataQuiz = undefined;
                }
                appendToList($quizzes, data.name, { // append just this one
                    "quizname": data.name,
                    "quizid": data.id
                });
            }
            // Append all quizzes
            else {
                quizzes.innerHTML = ""; // clean quizzes list
                for (var id in data.quiz) {
                    if (!GlobalQuiz[data.quiz[id]]) {
                        GlobalQuiz[data.quiz[id]] = new Object();
                    }
                    appendToList($quizzes, data.quiz[id], {
                        "quizname": data.quiz[id],
                        "quizid": id
                    });
                }
                manager.isFirstStart && manager.firstStart();
            }
            updateScrollbar();
            $spinnerWrap.hide();
        },
        receiveQuiz: function (data) {
            var action;
            if (!data) {
                console.log({ error: "[receiveQuiz]: an unknown error occured" });
            }
            else if (data.error === "unauthorized") {
                dialog.activity( "default-close" );
                dialog = Dialog.spawn( "unauthorized" ).open();
            }
            else if (data.error && data.error !== "okay") {
                console.log(data.error);
            }
            else if (TempDataQuiz && Object.keys(TempDataQuiz).length > 0) {
                action = $.extend({}, TempDataQuiz["#action#"]);
                var name = action.name;
                var dataQuestions = $.extend({}, TempDataQuiz[name]);
                TempDataQuiz = undefined;
            }
            else {
                try {
                    var dataQuestions = data.quiz.data;
                    var name = data.quiz.name;
                    if (typeof(dataQuestions) === "string") {
                        dataQuestions = JSON.parse(dataQuestions);
                    }
                } catch (err) {
                    console.log({ error: "an unknown error occured" }, err);
                    return;
                }
            }
            GlobalQuiz[name] = {};
            GlobalQuiz[name] = $.extend({}, dataQuestions); // Save
            manager.appendQuestions(name, GlobalQuiz[name], action);
            $spinnerWrap.hide();
        },
        appendQuestions: function (name, data, action) {
            if (!data) data = GlobalQuiz[name];
            if (action && action.animate === "add") { // append just this one
                appendToList($questions, data[action.type][action.n].ques, {
                    'question': action.question }, action.animate);
                manager.cleanQuestionEdit();
            }
            else if (action && action.animate === "update") { // Update just this one
                appendToList($questions, data[action.type][action.n].ques, {
                    'question': action.question }, action.animate);
            }
            else { // Append All: update all, delete one or append all
                questions.innerHTML = ""; // clean all questions
                for (var type in data) {
                    for (var n in data[type]) {
                        appendToList($questions, data[type][n].ques, {
                            'question': [name, type, n].join('|')
                        }, action);
                    }
                }
                !!action && action.animate === "delete" && manager.cleanQuestionEdit();
            }
            updateScrollbar();
        },
        getQuiz: function (name) {
            if (Object.keys( GlobalQuiz[name] ).length === 0) {
                $spinnerWrap.show();
                quizDB.getquiz(name, manager.receiveQuiz);
            } else {
                manager.appendQuestions(name);
            }
        },
        // Choose The type of select option: multilist, truefalse, fill, list, cards.
        changeTypeAnswer: function(select) {
            if (select && typeof(select) === "object") { // default event
                var selectType = select.target.value;
            }
            else if (select && typeof(select) === "string") { // params string
                var selectType = select;
                $selectTypeAns.find("."+select)[0].selected = true; // force select
            }
            else if ($selectTypeAns.find(":selected")) { // no params
                var selectType = $selectTypeAns.find(":selected").val();
            }
            else { return }

            $answers.hide();
            if (selectType === "type-tf") {
                $answers.filter(".truefalse").show();
            } else if (selectType === "type-multiList" || selectType === "type-multi") {
                $answers.filter(".multi").show();
            } else {
                $answers.filter(".ans-fill").show();
            }
        },
        showEditQuestion: function (dataStr) {
            manager.cleanQuestionEdit("Update");

            // Parse dataStr: name|type|n
            var info = dataStr.split('|');
            var name = info[0];
            var type = info[1];
            var n    = info[2];
            var quiz = GlobalQuiz[name][type] [n];

            manager.changeTypeAnswer("type-"+type);
            questionInput.value = quiz.ques;
            
            if (type == "fill" || type == "cards") {
                $answers.filter(".ans-fill").val(quiz.ans);
            }
            else if (type == "tf") {
                $answers.filter(".value-true")[0].checked = true == quiz.ans;
                $answers.filter(".value-false")[0].checked = false == quiz.ans;
            }
            else { // improve this, when inputs < answers
                var answers = quiz.ansSel.slice(0);
                var $inputs = $answers.filter(".multi.ans-multi");
                $inputs.filter(function() {
                    if (answers.length > 0) {
                        this.value = answers.shift(); // answer
                        if ($inputs[ $inputs.index(this) + 1 ]) { // correct answer
                            var nextNode = $inputs[ $inputs.index(this) + 1 ];
                            nextNode.value = quiz.ans;
                            $(nextNode).parent().find("[name=multi]").prop("checked", true);
                        }
                    }
                });
            }
        },
        cleanQuestionEdit: function (valueBtn) {
            // Smart: dont clean when Btn.value === "Add"
            if (valueBtn === "smart" && addUpdateQues.value === "Add" ) {
                $deleteQues.hide();
                return;
            } // smart options
            if (valueBtn === "smart") valueBtn = "Add"; // Default
            if (!valueBtn) valueBtn = "Add"; // Default
            // clean all
            questionInput.value = "";
            $answers.filter("[type=text]").val("");
            $answers.filter("[type=radio]:checked").prop("checked", false);
            addUpdateQues.value = valueBtn;
            $addUpdateQues.hide();
            // hide deleteBtn when Btn.value === "Add", viceversa show it
            valueBtn === "Add"    && $deleteQues.hide();
            valueBtn === "Update" && $deleteQues.show();
        },
        isFirstStart: true,
        firstStart: function() {
            manager.isFirstStart = false;
            $quizzes.find(":first")[0].click();
        }
    }

    /*** Quiz DB ***/
    var quizDB = {
        getquizzes: function(callback) {
            XHR.get("/api/quizzes/", callback);
        },
        getquiz: function(name, callback) {
            if (name === undefined) { return }
            XHR.get("/api/quizzes/name/"+name, callback);
        },
        updatequiz: function (id, name, data, callback) {
            if (!data) { data = {} }
            var quiz = {
                id: id,
                name: name,
                data: data,
                options: ""
            }
            XHR.post("/api/updatequiz", quiz, callback, "application/json");
        },
        deletequiz: function (id, callback) {
            if ( isNaN(Number(id) ) ) {
                console.log("Error ID:" + id + " is not a valid Number");
            }
            var pid = { id: Number(id) };
            XHR.post( "/api/deletequiz", pid, callback, "application/json" );
        },
        savequiz: function (name, data, callback) {
            var quiz = {
                id: null,
                name: name,
                data: data,
                options: null,
            }
            XHR.post( "/api/savequiz", quiz, callback, "application/json" );
        }
    }

    var updateQuizTemp = function (question, answers, anscorrect, newType) {
        var info = $questions.find(".selected").attr("question").split('|');
        var name = info[0];
        var type = info[1];
        var n    = info[2];

        if (type != newType) { // It means we need to delete the question and create a new one
            storeQuizTemp(name, question, answers, anscorrect, newType, undefined, "update all");
            TempDataQuiz[name][type].splice(parseInt( n, 10 ), 1);
            if (TempDataQuiz[name][type].length <= 0) {
                delete TempDataQuiz[name][type];
            }
        }
        else { // It means we need to overwrite the question in the position n
            storeQuizTemp(name, question, answers, anscorrect, newType, n, "update");
        }
    }

    var storeQuizTemp = function (name, question, answers, anscorrect, type, position, action) {
        TempDataQuiz = {};
        TempDataQuiz[name] = $.extend({}, GlobalQuiz[name]);
        if (!position && TempDataQuiz[name][type]) { // create a new question
            position = TempDataQuiz[name][type].length;
        } else if (!position && !GlobalQuiz[name][type]) {
            position = 0;
            TempDataQuiz[name][type] = [];
        } // if position then name & type exist

        if (type == "multiList" || type == "multi") {
            TempDataQuiz[name][type] [position] = {ques: question, ans: anscorrect, ansSel: answers};
        }
        else { // Fill, cards, true-false
            TempDataQuiz[name][type] [position] = {ques: question, ans: anscorrect};
        }
        TempDataQuiz["#action#"] = { // info to animate the element
            animate: action,
            name: name,
            type: type,
            n: position,
            question: [name, type, position].join("|"),
            attr: "question"
        }
    }

    var saveQuiz = function (name, callback) {
        var id = $quizzes.find(".selected").attr("quizid");
        $spinnerWrap.show();
        quizDB.updatequiz(id, name, TempDataQuiz[name], callback);
    }

    selectTypeAns.addEventListener( "change", manager.changeTypeAnswer, false );

    // Quizzes List
    $quizzes.on("click", "li", function(ev) {
        var $that = $(this);
        if (!$that.hasClass("selected")) {
            $quizzes.find(".selected").removeClass("selected");
            $questions.find(".selected").removeClass("selected");
            $that.addClass("selected");
            $deleteQuiz.addClass("selected");
            manager.getQuiz($that.text());
            manager.cleanQuestionEdit("smart");
        }
        return false;
    });
    // Append Input to Change name of the Quiz
    $quizzes.on("dblclick", "li", function(ev) {
        var $that = $(this);
        if ($that.hasClass("selected")) {
            $quizzes.find("input").remove(); // remove old inputs
            $that.hide();
            // input
            var $input = $inputNewQuiz.clone();
            $input.val( $that.text() );
            $input.removeClass("add-new-quiz").show();
            $input.attr("quizname", $that.text());
            $input.attr("quizid", $that.attr("quizid"));
            $that.after($input); // insert new input
            $input.focus()[0].select();
        }
        return false;
    });
    // Live test if the new name exits
    $quizzesContainer.on("input", "input", function(ev) {
        var $that = $(this);
        if (!!GlobalQuiz[this.value] && $that.attr("quizname") !== this.value) {
            $that.addClass("focus-red");
        } else {
            $that.removeClass("focus-red");
        }
    });
    // When the input Change Name Quiz lose the focus then remove it
    $quizzes.on("focusout", "input", function(ev) {
        $(this).hide();
        $quizzes.find(".selected").show();
    });
    // When the inputNewQuiz lose the focus then hide it
    $inputNewQuiz.focusout(function(ev) {
        var $that = $(this);
        setTimeout(function() {
            $that.hide("slow");
        }, 100);
    });
    // Input to enter the new name of the Quiz
    $quizzesContainer.on("keypress", "input", function(ev) {
        var code = ev.keyCode ? ev.keyCode : ev.which;
        if (code !== 13) return true;
        var $that = $(this).hide();
        // Change Name of Quiz
        if ($that.attr("quizname")) {
            if (!GlobalQuiz[this.value] || $that.attr("quizname") !== this.value) {
                var oldname = $that.attr("quizname");
                var newname = $that.val();
                var quizid  = Number($that.attr("quizid"));
                TempDataQuiz = {
                    "#action#": {
                        oldname: oldname,
                        newname: newname,
                        animate: "changeNameQuiz"
                    }
                }
                $spinnerWrap.show();
                quizDB.updatequiz(quizid, newname, GlobalQuiz[oldname], manager.receiveQuizzes);
            }
        }
        // Create New Quiz
        else if (!GlobalQuiz[this.value]) {
            TempDataQuiz = {
                "#action#": {
                    newname: this.value,
                    animate: "newQuiz"
                }
            }
            $spinnerWrap.show();
            quizDB.savequiz(this.value, {}, manager.receiveQuizzes);
        }
        return false;
    });
    // Button add Quiz : show the input for the new Quiz
    $addQuiz.click(function() {
        $inputNewQuiz.show();
        $inputNewQuiz[0].focus();
    });

    $deleteQuiz.click(function(ev) {
        var $selected = $quizzes.find(".selected");
        if ($selected.length > 0) {
            $deleteQuiz.removeClass("selected");
            manager.cleanQuestionEdit("smart");
            questions.innerHTML = "";
            TempDataQuiz = {
                "#action#": {
                    animate: "delete",
                    name: $selected.text()
                }
            }
            $spinnerWrap.show();
            quizDB.deletequiz($selected.attr("quizid"), manager.receiveQuizzes);
        }
        return false;
    });

    // Questions List
    $questions.on("click", "li", function(ev) {
        var $that = $(this);
        if (!$that.hasClass("selected")) {
            $questions.find(".selected").removeClass("selected");
            $that.addClass("selected");
            manager.showEditQuestion($that.attr("question"));
        }
        return false;
    });
    $addQuestion.click(function() {
        $questions.find(".selected").removeClass("selected");
        manager.cleanQuestionEdit("smart");
        questionInput.focus();
        $(questionInput).fancyAnimate({mode: "add"});
    });

    $deleteQues.click(function(ev) {
        var $deleted = $questions.find(".selected").addClass("deleted");
        var $selected = $quizzes.find(".selected");
        var info = $deleted.attr("question").split("|");
        var name = info[0];
        var type = info[1];
        var pos  = info[2];
        TempDataQuiz = new Object;
        TempDataQuiz[name] = $.extend({}, GlobalQuiz[name]);
        TempDataQuiz[name][type].splice(parseInt( pos, 10 ), 1);
        TempDataQuiz[name][type].length <= 0 && delete TempDataQuiz[name][type];
        TempDataQuiz["#action#"] = {
            animate: "delete",
            name: $selected.text()
        }
        saveQuiz(name, manager.receiveQuiz);
        return false;
    });

    // When it clicks "Update Question" or "Create Question" 
    addUpdateQues.addEventListener( "click", function () {
        var question = stripBlanks(questionInput.value);
        var typeAns = $selectTypeAns.find(":selected").attr("typequiz");
        var anscorrectIndex = -1; // IndexOf correct answer
        
        if (question == '') {  // alert("You must enter a question");
            $(questionInput).fancyAnimate();
            $(this).fancyAnimate();
            $error.text("You must enter a question");
            $error.fancyAnimate({mode:"error"}, cleanError);
            return false;
        }
        
        // Search inputs answers from Multilist, TrueFalse, Fill... Quiz
        var answers = [];
        if (typeAns == "fill" || typeAns == "cards") {
            var ansFill = stripBlanks( $answers.filter(".ans-fill").val() );
            if (ansFill !== '') {
                answers.push(ansFill);
            } else {
                $answers.filter(".ans-fill").fancyAnimate();
                $(this).fancyAnimate();
                $error.text("You must enter an answer");
                $error.fancyAnimate({mode:"error"}, cleanError);
                return false;
            }
            anscorrectIndex = 0; // IndexOf correct answer
        }
        else if (typeAns == "tf") { // type TrueFalse
            if ($answers.filter(".truefalse[type=radio]:checked").length > 0) {
                var valueTrueChecked = $answers.filter(".value-true:checked")[0];
                if (valueTrueChecked && valueTrueChecked.checked) {
                    answers = [true];
                } else {
                    answers = [false];
                }
                anscorrectIndex = 0; // IndexOf correct answer
            } else { // Focus radio box!
                $answers.filter(".truefalse").parent().fancyAnimate();
                $(this).fancyAnimate();
                return false;
            }
        }
        else { // type MultiList and List
            var $anscorrectInputRadio = $answers.filter(".radio-multi:checked");
            if ($anscorrectInputRadio.length > 0) {
                var $inputRadio = $answers.filter(".radio-multi");
                anscorrectIndex = $inputRadio.index( $anscorrectInputRadio[0] );
            } else { // Focus radio box!
                $answers.filter(".multi").fancyAnimate();
                $(this).fancyAnimate();
                $error.text("Select the correct answer!");
                $error.fancyAnimate({mode:"error"}, cleanError);
                return false;
            }

            var $inputs = $answers.filter(".multi.ans-multi");
            $inputs.filter(function() {
                answers.push( stripBlanks(this.value) );
            });
            
            // You must enter at least 2 answers
            if (answers[0] === '' || answers[1] === '') {
                $answers.filter(".ans-multi:lt(2)").fancyAnimate();
                $(this).fancyAnimate();
                $error.text("You must enter at least 2 answers!");
                $error.fancyAnimate({mode:"error"}, cleanError);
                return false;
            }
        }

        // Null
        for (var i=0; i<answers.length; i++) {
            if (anscorrectIndex === i && answers[i] === '') {
                $answers.filter(".ans-multi:eq("+anscorrectIndex+")").fancyAnimate();
                $(this).fancyAnimate();
                $error.text("anscorrect is Null!");
                $error.fancyAnimate({mode:"error"}, cleanError);
                return false;
            };
        }
        // equality
        for (var i=1; i<answers.length; i++) {
            for (var j=0; j<i; j++) {
                if (answers[i] && answers[j] && answers[i] === answers[j]) {
                    $answers.filter(".ans-multi:eq("+i+")").fancyAnimate();
                    $answers.filter(".ans-multi:eq("+j+")").fancyAnimate();
                    $(this).fancyAnimate();
                    $error.text("equal answers");
                    $error.fancyAnimate({mode:"error"}, cleanError);
                    return false;
                }
            }
        }
        // get anscorrect from answers
        var answercorrect = answers[anscorrectIndex];
        answers.splice(anscorrectIndex, 1);
        answers = answers.filter(function(arr) {return arr}); // clean empty answer
        var nameQuiz = $quizzes.find(".selected").text();

        if ($quizzes.find(".selected").length <= 0) {
            $error.text("You need to select a Quiz or create a new one.");
            $error.fancyAnimate({mode:"error"}, cleanError);
            return;
        }

        if ($questions.find(".selected").length > 0) { // It means we just have to update question
            updateQuizTemp(question, answers, answercorrect, typeAns);
        }
        else { // Create a new one
            storeQuizTemp(nameQuiz, question, answers, answercorrect, typeAns, undefined, "add");
        }
        saveQuiz(nameQuiz, manager.receiveQuiz);
    }, false );

    // Show button Update when changes
    questionInput.addEventListener( "input", function(ev) {
        addUpdateQues.value === "Update" && $addUpdateQues.show();
    }, false );
    $answers.filter("[type=text]").on("input", function(ev) {
        addUpdateQues.value === "Update" && $addUpdateQues.show();
    });
    $answers.filter("[type=radio]").change(function(ev) {
        addUpdateQues.value === "Update" && $addUpdateQues.show();
    });
    $selectTypeAns.change(function(ev) {
        addUpdateQues.value === "Update" && $addUpdateQues.show();
    });

    var cleanError = function() {
        $error.text('');
    }

    var errorHandler = function(e) {
        var options = {
            mode: "error",
            duration: 4000
        }
        switch(e.target.error.code) {
            case e.target.error.NOT_FOUND_ERR:
                $error.text('File Not Found!');
                $error.fancyAnimate({mode: "error"}, cleanError);
                break;
            case e.target.error.NOT_READABLE_ERR:
                $error.text('File is not readable');
                $error.fancyAnimate({mode: "error"}, cleanError);
                break;
            case e.target.error.ABORT_ERR:
                break;
            default:
                $error.text('An error occurred reading this file.');
                $error.fancyAnimate({mode: "error"}, cleanError);
        };
    }

    var onLoadFileHandler = function(theFile, data) {
        var typeQuizzes = ["tf", "multiList", "multi", "fill", "cards"];
        var typeData, isQuizType,
            quizzes = {};
        // type of json files
        Object.keys(data).forEach(function(name) {
            isQuizType = $.inArray(name, typeQuizzes) !== -1;
            if ( isQuizType && $.isArray(data[name]) ) {
                // import the quiz from from the data
                typeData = "import-quiz";
                return false;
            }
            else if ( !isQuizType ) {
                Object.keys(data[name]).forEach(function(type) {
                    if ( $.isArray(data[name][type], typeQuizzes) && $.isArray(data[name][type]) ) {
                        // import quizzes from the data
                        typeData = "import-quizzes";
                        return false;
                    }
                });
            }
            return false;
        });
        if (typeData === "import-quiz") {
            quizzes[theFile.name] = data;
        }
        else if (typeData === "import-quizzes") {
            quizzes = data;
        }
        else {
            $error.text('Import Quiz: An error occurred reading this file.');
            $error.fancyAnimate({mode: "error"}, cleanError);
            return false;
        }
        
        // Import each quiz
        manager.importQuizzes(quizzes);
    }

    // Import Quiz
    $importQuiz.change(function(e) {
        e.stopPropagation();
        e.preventDefault();
        var files = e.target.files; // FileList object

        // Loop through the FileList and render json files.
        for (var i = 0, f; f = files[i]; i++) {
            // Only process json files.
            var reader = new FileReader();

            reader.onerror = errorHandler;
            reader.onload = (function(theFile) {
                return function(e) {
                    var result = JSON.parse(e.target.result);
                    onLoadFileHandler(theFile, result);
                };
            })(f);

            reader.readAsText(f);
        }
    });

    // Create a Link to Export/Download Quizzes to a file JSON
    var createDownloadFile = function() {
        var json = JSON.stringify(GlobalQuiz);
        var blob = new Blob([json], {type: "application/json"});
        var url  = URL.createObjectURL(blob);

        var a = document.createElement('a');
        a.download    = "exported-quizzes.json";
        a.href        = url;
        a.textContent = "";
        a.classList.add("export-quiz-link");

        $exportQuiz.after(a);
        a.click();
    };
    // Export Quizzes to json file
    $exportQuiz.click(function() {
        // Remove link to download file json
        $exportQuiz.next("export-quiz-link").remove();
        // Create a Link to download
        createDownloadFile();
    });

    // Resize Dialog
    var updateScrollbar = function() {
        if (dialog) {
            dialog["quizzesScrollbar"] && dialog["quizzesScrollbar"].update();
            dialog["questionsScrollbar"] && dialog["questionsScrollbar"].update();
        }
    }
    $(window).resize(updateScrollbar);
    addScrollbar($quizzes.parents(".scrollbar-container")[0], "quizzesScrollbar");
    addScrollbar($questions.parents(".scrollbar-container")[0], "questionsScrollbar");
    manager.changeTypeAnswer("type-tf");       // by default answer quiz is true-false
    quizDB.getquizzes(manager.receiveQuizzes); // On start dialog load quizzes
    
  });
  
});

