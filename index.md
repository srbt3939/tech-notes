---
layout: default
title: トップページ
script: toppage.js
---

# 技術メモ一覧

## AWS
- [Using Lambda with SQS](./notes/aws/UsingLambdaWithSQS.md)

## Python メモ
- [Python メモ](./notes/python.md)

## git
- [Gitコミットメッセージの書き方とアンチパターン](./notes/git/GitCommentMeassageGuide.md)

## GitHub
- GitHub Pages(編集中)
- このページについて
    [About ページ](./about.md)


---
test run toppage.js
3D.jsのテストもついでに
<div>
  <svg id="demo-svg" width="250" height="250"></svg>
</div>
<script src="https://d3js.org/d3.v7.min.js"></script>
<script>
  d3.select("#demo-svg")
    .append("rect")
    .attr("x", 50).attr("y", 50)
    .attr("width", 150)
    .attr("height", 100)
    .attr("fill", "orange");
</script>