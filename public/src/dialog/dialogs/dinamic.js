/* This Source Code Form is subject to the terms of the MIT license
 * If a copy of the MIT license was not distributed with this file, you can
 * obtain one at https://raw.github.com/mozilla/butter/master/LICENSE */

define( [ "text!dialog/dialogs/dinamic.html", "dialog/dialog", "util/scrollbars", "util/time" ],
  function( LAYOUT_SRC, Dialog, Scrollbars, Util ) {
    Dialog.register( "dinamic", LAYOUT_SRC, function ( dialog, _data ) {
        dialog.assignEscapeKey( "default-close" );
        dialog.assignButton( ".close-button", "close" );
        dialog.enableCloseButton();
        
        var _options = _data.trackEventStart.lines.allRules[_data.endID],
        _trackEvent  = _data.trackEventStart,
        _position    = _data.position,
        $rootElement = $( dialog.rootElement ),
        // Headers
        $headers           = $rootElement.find("a.popup-tab-header-a"),
        $headerScore       = $headers.filter(".header-score"),
        $headerQuestions   = $headers.filter(".header-questions"),
        $headerPass        = $headers.filter(".header-pass"),
        // Body Tabs
        $popupTab          = $rootElement.find(".popup-tab"),
        $popupScore        = $popupTab.filter(".popup-score"),
        $popupQuestions    = $popupTab.filter(".popup-questions"),
        $popupPass         = $popupTab.filter(".popup-pass"),
        // Score
        $assuredScore      = $popupScore.find(".assured-score"),
        $score             = $popupScore.find(".score"),
        // Questions
        $questions         = $popupQuestions.find(".questions"),
        // Pass
        $assureTimePass    = $popupPass.find(".value-time-pass"),
        $assuredPass       = $popupPass.find(".assured-pass"),
        $assuredTime       = $popupPass.find(".value-time"),
        $assuredTimeSelect = $popupPass.find(".value-time-select"),
        // Hidden elements
        $hiddenFields      = $rootElement.find("#append-hidden-elements"),
        // Quizzes
        GlobalQuiz         = _trackEvent.popcornOptions.quizJSON;

        var spliceQuestions = function(options) {
            if (!options.indexQuestion || options.indexQuestion <= 0) {
                return GlobalQuiz[options.name];
            }
            var questionsArray = [];
            var quiz = GlobalQuiz[options.name];
            Object.keys(quiz).forEach(function(tQuiz) {
                var typeQuiz = tQuiz;
                var questions = quiz[typeQuiz].slice(0);
                Object.keys(questions).forEach(function(i) {
                    questionsArray[questionsArray.length] = {};
                    questionsArray[questionsArray.length-1][typeQuiz] = [questions[Number(i)]];
                });
            });
            var index = Number(options.indexQuestion);
            return questionsArray.slice(index-1, index)[0];
        }

        var addScrollbar = function( scrollbarContainer ) {
            var scrollbarInner = scrollbarContainer.querySelector( ".scrollbar-inner" );
            var scrollbarOuter = scrollbarContainer.querySelector( ".scrollbar-outer" );

            var options = options || scrollbarInner && {
                inner: scrollbarInner,
                outer: scrollbarOuter || scrollbarInner.parentNode,
                appendTo: scrollbarContainer || rootElement
            };
            if ( !options ) return;

            dialog.scrollbar = new Scrollbars.Vertical( options.outer, options.inner );
            options.appendTo.appendChild( dialog.scrollbar.element );

            dialog.scrollbar.update();
            return dialog.scrollbar;
        };

        var togglePopupTab = function(keyrule) {
            if (!keyrule) keyrule = _options.keyrule;
            // show the keyrule tab
            if (keyrule === "score") {
                $headerScore.click();
            } else if (keyrule === "questions") {
                $headerQuestions.click();
            } else if (keyrule === "pass" || keyrule === "time") {
                $headerPass.click();
            }
            // Desactive the undefined keyrules
            !_options.score     && !!$headerScore.hide();
            !_options.questions && !!$headerQuestions.hide();
            !_options.pass      && !!$headerPass.hide();
            !_options.time      && !!$popupPass.find(".fieldset-time").hide();
        }

        var setScore = function() {
            $assuredScore.find("[value='"+_options.score.condition+"']").prop("selected", true);
            $score.val(_options.score.value);
            _options.keyrule = "score";
        }

        var setTimePass = function() {
            if (_options.keyrule !== "time" && _options.keyrule !== "pass") {
                var $checked = $assureTimePass.filter(":checked");
                if ($checked.hasClass("value-assure-time")) {
                    _options.keyrule = "time";
                } else {
                    _options.keyrule = "pass";
                }
            }
            // Check "time" or "pass"
            if (_options.keyrule === "time") {
                $assureTimePass.filter(".value-assure-pass").prop("checked", false);
                $assureTimePass.filter(".value-assure-time").prop("checked", true);
                if (_options.time.condition) {
                    $assuredTimeSelect.find("[value='"+_options.time.condition+"']").prop("selected", true);
                }
                if (_options.time.value) {
                    $assuredTime.val(_options.time.value);
                }
            } else if (_options.keyrule === "pass") {
                $assureTimePass.filter(".value-assure-pass").prop("checked", true);
                $assureTimePass.filter(".value-assure-time").prop("checked", false);
                $assuredPass.find("[value='"+_options.pass+"']").prop("selected", true);
            }
        }

        var appendToList = function($list, text, attrs, answers, answerCorrect) {
            $elem = $(document.createElement( "li" ));
            $elem.text(text);
            $.each(attrs, function(name, value) {
                $elem.attr(name, value); // attributes
            });
            // append options for assured-pass
            var $respondField = $hiddenFields.find(".assured-pass-wrapper").clone().hide();
            var $answerField = $hiddenFields.find(".answer-checkbox-field");
            var $answerFieldClone = $answerField.clone();
            // First answer is correct
            $answerFieldClone.find(".answer-label").text( answerCorrect.toString() ).addClass("correct-answer");
            $respondField.append($answerFieldClone);
            // Append other answers
            $.each(answers, function(index, answer) {
                $answerFieldClone = $answerField.clone();
                $answerFieldClone.find(".answer-label").text(answer.toString());
                $respondField.append($answerFieldClone);
            });

            $list.append($elem);
            $elem.append($respondField);
        }

        var appendQuestions = function(questions) {
            if (!questions) questions = _options.questions;
            // get quizname from trackEvent
            var quizname = _trackEvent.popcornOptions.name;
            var name = quizname;
            //var data = GlobalQuiz[name];
            var data = spliceQuestions(_trackEvent.popcornOptions);
            console.log(spliceQuestions(_trackEvent.popcornOptions));
            // Load again quiz
            if (quizname !== questions.name) {
                $questions.html(""); // empty
                questions.name = quizname;
                questions.attr = undefined;
                questions.type = undefined;
            }
            // append questions
            if ($questions.find("li").length <= 0) {
                var answers, answerCorrect;

                for (var type in data) {
                    for (var n in data[type]) {

                        if (type === "tf") {
                            answers = [data[type][n].ans === false];
                        } else if (type === "fill" || type === "cards") {
                            answers = ["other answers"];
                        } else {
                            answers = data[type][n].ansSel;
                        }
                        answerCorrect = data[type][n].ans; // push correct answer

                        appendToList($questions, data[type][n].ques, {
                            question: [name, type, n].join('|'),
                            quesname: name,
                            questype: type,
                            quespos: n
                        }, answers, answerCorrect);
                    }
                }
            }
            // click question
            if (questions.attr) {
                $questions.find("[question='"+questions.attr+"']").click();
            }
            else if (questions.type && questions.n) {
                var attrQuestions = [questions.name, questions.type, questions.n].join("|");
                $questions.find("[question='"+attrQuestions+"']").click();
            }
            else if (!$questions.find(".selected").hasClass("selected")) {
                $questions.find("li:first").click();
            } else {
                $questions.find(".selected").click();
            }
        }

        var setQuestions = function(questions) {
            if (!questions) questions = _options.questions;
            var $selected;
            _options.keyrule = "questions";

            // select the question
            if (questions.attr) {
                $selected = $questions.find("[question='"+questions.attr+"']");
            }
            else if (questions.type && questions.n) {
                var attrQuestions = [questions.name, questions.type, questions.n].join("|");
                $selected = $questions.find("[question='"+attrQuestions+"']");
            }
            else {
                return;
            }

            // Select Assured by answer (correct | incorrect | specific)
            if (questions.assured === "correct answer") {
                $selected.find(".value-correct-answer").prop("checked", true);
            }
            else if (questions.assured === "incorrect answer") {
                $selected.find(".value-incorrect-answer").prop("checked", true);
            }
            else if (questions.assured === "specific answer") {
                $selected.find(".value-specific-answer").prop("checked", true);
            }

            // Select type of user Answer
            if (questions.userAnswer === true || questions.userAnswer === "true") {
                questions.userAnswer = true;
                $selected.find(".specific-user-answer [value='true']").prop("selected", true);
            }
            else {
                questions.userAnswer = false;
                $selected.find(".specific-user-answer [value='false']").prop("selected", true);
            }

            // Check and uncheck answers
            var $answerCheckboxs = $selected.find(".answer-checkbox");
            if (typeof(questions.answers) === "string") {
                questions.answers = [questions.answers];
            }
            if ($.isArray(questions.answers)) {
                $answerCheckboxs.prop("checked", false); // unchecked all
                for (var index in questions.answers) {
                    $answerCheckboxs.filter(function() {
                        var labelAnswer = $(this).siblings(".answer-label").text();
                        if (labelAnswer === questions.answers[index]) {
                            this.checked = true;
                        }
                    });
                }
            }
        }
        var setParamsQuestion = function($that) {
            var questions = _options.questions;
            var $assuredAnswerPass = $that.parents(".assured-pass-wrapper");

            var $assured = $assuredAnswerPass.find(".assured-question:checked");
            if ($assured.hasClass("value-correct-answer")) {
                questions.assured = "correct answer";
            }
            else if ($assured.hasClass("value-incorrect-answer")) {
                questions.assured = "incorrect answer";
            }
            else if ($assured.hasClass("value-specific-answer")) {
                questions.assured = "specific answer";
            }
            questions.userAnswer = $assuredAnswerPass.find(".specific-user-answer :selected").val();
        }
        var setUserAnswers = function($that) {
            var questions = _options.questions;
            var $quesParent = $that.parents("li[question='"+questions.attr+"']");
            questions.answers = $quesParent.find(".answer-checkbox:checked").map( function() {
                return $(this).siblings('.answer-label').text();
            }).get();
        }

        var reloadPopup = function() {
            if (_options) {
                var offsetGlobalY = 10; // manual offset
                var offsetGlobalX = 20;
                var offsetHeight  = 30;    // Arrow height
                var height = $rootElement.height() + offsetHeight;
                $rootElement.css({
                    "left": _position.left - offsetGlobalX,
                    "top": _position.top - height - offsetGlobalY
                });
            }
        }

        $(function() {
            // Score Changes
            if (_options.score) {
                $headerScore.click(function() {
                    if ( $(this).hasClass(".butter-active") ) return;
                    $headers.removeClass("butter-active");
                    $headerScore.addClass("butter-active");
                    $popupTab.hide();
                    $popupScore.show();
                    setScore();
                    _trackEvent.lines.update(_data.endID);
                });
                $assuredScore.change(function(ev) {
                    _options.score.condition = $assuredScore.find(":selected").attr("value");
                    _options.keyrule = "score";
                    _trackEvent.lines.update(_data.endID);
                });
                $score.change(function() {
                    _options.score.value = this.value;
                    _options.keyrule = "score";
                    _trackEvent.lines.update(_data.endID);
                });
            }

            // Questions
            if (_options.questions) {
                $questions.on("click", "li", function(ev) {
                    var $that = $(this);
                    if (!$that.hasClass("selected")) {
                        $questions.find(".selected").removeClass("selected").find(".assured-pass-wrapper").slideUp();
                        $that.addClass("selected");
                        $that.find(".assured-pass-wrapper").slideDown(100, function() {
                            dialog.scrollbar.update();
                            setTimeout(function() {
                                dialog.scrollbar.update();
                            }, 200);
                        });

                        var name = _options.questions.name;
                        var attr = $that.attr("question");
                        var type = $that.attr("questype");
                        var pos  = Number($that.attr("quespos"));
                        _options.questions.attr = attr;
                        _options.questions.type = type;
                        _options.questions.n    = pos;
                        _options.questions.ques = GlobalQuiz[name][type][pos].ques;
                        setQuestions();
                        _trackEvent.lines.update(_data.endID);
                    }
                });
                $headerQuestions.click(function(ev) {
                    if ( $(this).hasClass("butter-active") ) {
                        dialog.scrollbar.update(_data.endID, true);
                        return;
                    }
                    $headers.removeClass("butter-active");
                    $headerQuestions.addClass("butter-active");
                    $popupTab.hide();
                    $popupQuestions.show();
                    appendQuestions();
                    dialog.scrollbar.update(_data.endID, true);
                });

                $questions.on("change", "[name='assured-pass']", function(ev) {
                    ev.preventDefault();
                    setParamsQuestion($(this));
                    _trackEvent.lines.update();
                });
                $questions.on("change", ".answer-pass", function(ev) {
                    ev.preventDefault();
                    setParamsQuestion($(this));
                    _trackEvent.lines.update();
                });
                $questions.on("change", ".specific-user-answer", function(ev) {
                    ev.preventDefault();
                    setParamsQuestion($(this));
                    _trackEvent.lines.update();
                });
                $questions.on("change", ".answer-checkbox", function(ev) {
                    ev.preventDefault();
                    setUserAnswers($(this));
                    _trackEvent.lines.update();
                });
            }

            // Pass Changes
            if (_options.pass) {
                $headerPass.click(function() {
                    if ( $(this).hasClass(".butter-active") ) return;
                    $headers.removeClass("butter-active");
                    $headerPass.addClass("butter-active");
                    $popupTab.hide();
                    $popupPass.show();
                    setTimePass();
                    _trackEvent.lines.update(_data.endID);
                });
                $assuredPass.change(function() {
                    _options.pass = $assuredPass.find(":selected").val();
                    _options.keyrule = "pass";
                    _trackEvent.lines.update(_data.endID);
                });
            }
            // Time Changes
            if (_options.time) {
                $assureTimePass.change(function(ev) {
                    var $checked = $assureTimePass.filter(":checked");
                    if ($checked.hasClass("value-assure-time")) {
                        _options.keyrule = "time";
                    } else {
                        _options.keyrule = "pass";
                    }
                    _trackEvent.lines.update(_data.endID);
                });

                $assuredTimeSelect.change(function() {
                    _options.time.condition = $(this).find(":selected").attr("value");
                    _options.keyrule = "time";
                    _trackEvent.lines.update();
                });

                $assuredTime.change(function() {
                    _options.time.value = Util.toSeconds(this.value);
                    _options.keyrule = "time";
                    _trackEvent.lines.update();
                });
            }

            dialog.registerActivity( "delete", function(){
              dialog.send("delete", {
                    instance: _data.trackEventStart,
                    endID: _data.endID
                });
            });
            dialog.assignButton( ".delete", "delete" );
            dialog.assignButton( ".delete2", "delete" );

            addScrollbar($popupQuestions[0]);
            togglePopupTab();
            // Reload position of the popup
            $rootElement.show(100, reloadPopup);
        });

    });
});
