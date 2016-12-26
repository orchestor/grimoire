class GrokUtils {
    constructor() {}
    computeDueTime(item) {
        var naow = Math.floor(Date.now() / 1000)
            //console.log("last", item["last"], item["interval"]);
        var dueTime = item["last"] + item["interval"];
        return naow - dueTime;
    }
    getQuizzableQuestions(grimoire) {
        var questions = [];
        for (var topic in grimoire) {
            for (var item in grimoire[topic]) {
                var added = false;

                //console.log("topic", topic, item);
                var duration = this.computeDueTime(grimoire[topic][item])
                if (duration > 0) {
                    for (var ii = 0; ii < questions.length - 1; ii++) {
                        if (questions[ii].duration <= duration && questions[ii + 1].duration >= duration) {
                            questions.splice(ii + 1, 0, { topic: topic, item: item })
                            added = true;
                        }
                    }
                } else {
                    //console.log("not due!");
                }
                if (!added) {
                    questions.push({ topic: topic, item: item });
                }
            }
        }
        return questions;
    }
}
module.exports = GrokUtils;